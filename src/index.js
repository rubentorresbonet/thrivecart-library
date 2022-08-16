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
        await this.page.goto('https://thrivecart.com/signin/')
        await this.page.fill('[placeholder="hello@thrivecart.com"]', username);
        await this.page.fill('[placeholder="..."]', password);
        await Promise.all([
            this.page.waitForResponse(res => res.url().includes('?view=products') && res.status() === 200),
            this.page.waitForNavigation(),
            this.page.click('input:has-text("Sign in")')
        ]);
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


        //await this.page.waitForSelector(`.order-row-customer-name:text("${student_name}")`, { timeout:5000 })

        if (verbose) console.log(`Opening access popup`);
        await this.page.click('text=Give accessSuspendRevokeChange plan...')
        await this.page.click('text=Give access')

        await this.page.waitForSelector(`select[name="course_id"]`, { timeout:5000 })
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
        await this.page.click('button:has-text("Give access")');
        await this.page.waitForSelector('text=Updated your student',{timeout:10000})
        if (verbose) console.log('Access given')

        return true
    }
}