import { chromium } from 'playwright-core'

export class Thrivecart {

    constructor()
    {
        this.browser = null
        this.page = null
    }

    async startLocal(headless = true)
    {
        this.browser = await chromium.launch({headless: headless})
        this.page = await this.browser.newPage();
    }

    async startCdp(address)
    {
        this.browser = await chromium.connectOverCDP(address)
        this.page = await this.browser.newPage();
    }

    async finish()
    {
        await this.browser.close();
    }

    async login(username, password, verbose = false)
    {
        const tries = 3;
        const timeoutMs = 8000;
        console.log(`Login attempt ${i+1}/${tries}`);
        await this.page.goto('https://thrivecart.com/signin/')
        await this.page.fill('[placeholder="hello@thrivecart.com"]', username);
        await this.page.fill('[placeholder="..."]', password);
        await Promise.all([
            this.page.waitForResponse(res => res.url().includes('?view=products') && res.status() === 200, { timeout: timeoutMs }),
            this.page.waitForNavigation({ timeout: timeoutMs }),
            this.page.click('input:has-text("Sign in")')
        ]);
    }

    async goToLearnModules()
    {
        await this.page.goto('https://thrivecart.com/thegamedevguru/#/learn')
    }

    async cloneLearnModule(course_id, name_new)
    {
        const plugin_url = 'https://thrivecart.com/thegamedevguru/api/v1/plugin/call/'
        let res = await this.page.request.post(plugin_url, {
            form: {
                plugin: 'core.courses',
                method: 'clone_course',
                course_id: course_id
            }
          });

        const new_module_data = await res.json()
        const new_course_id = new_module_data.course.id
        await this.page.request.post(plugin_url, {
            form: {
                plugin: 'core.courses',
                method: 'update_course',
                course_id: new_course_id,
                'opts[course][name]': name_new,
                'opts[course][id]': new_course_id,
                'opts[contents_patch]': '',
                'opts[recalc_queue]': false
            }
        });
    }

    async studentGiveAccess(student_name, course_name, verbose = false)
    {
        await this.page.goto('https://thrivecart.com/thegamedevguru/#/learn/students');
        await this.page.waitForSelector('text="Customer"');

        if (verbose) console.log(`Searching for student: "${student_name}"`);
        await this.page.fill('[placeholder="Search for student name or email address..."]', student_name);
        await Promise.all([
            this.page.waitForResponse(res => res.url().includes('view=view.student_iterate') && res.status() === 200),
            this.page.click('text=Search')
        ]);

        if (verbose) console.log(`Opening access popup`);
        await this.page.click('text=Give accessSuspendRevokeChange plan...')
        await Promise.all([
            this.page.click('text=Give access'),
            this.page.waitForResponse(res => res.url().includes('call/') && res.status() === 200),
            this.page.waitForSelector(`select[name="course_id"]`, { timeout:5000 })
        ])

        if (verbose) console.log(`Looking for course: ${course_name}`);
        const course = await this.page.$(`select[name="course_id"] option:has-text("${course_name}")`);
        if (course == null)
        {
          console.warn("Warning: could not find course: " + course)
          await this.page.click('text=CancelGive access >> button');
          await this.page.waitForTimeout(1000);
          return false
        }

        const course_label = await course.innerText();
        if (verbose) console.log(`Target course found: "${course_label}"`);
        await this.page.selectOption('select[name="course_id"]', {label: course_label});
      
        if (verbose) console.log('Giving access...')
        await Promise.all([
            this.page.click('button:has-text("Give access")'),
            this.page.waitForSelector('text=Updated your student',{timeout:10000}),
            this.page.waitForResponse(res => res.url().includes('?view=view.student_iterate') && res.status() === 200),
        ])
        if (verbose) console.log('Access given')

        return true
    }
}