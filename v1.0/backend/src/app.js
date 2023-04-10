const express = require('express')
require('./db/mongoose')
var path = require('path');
const fs = require('fs')
const puppeteer = require('puppeteer')
const yaml = require('js-yaml');
const swaggerUi = require('swagger-ui-express');
const schoolRouter = require('./routers/school.route')
const studentRouter = require('./routers/student.route')
const classRouter = require('./routers/class.route')
const examRouter = require('./routers/exam.route')
const markRouter = require('./routers/mark.route')
const roiRouter = require('./routers/roi.route')
const brandRouter = require('./routers/brand.route')
var cors = require('cors');

const spec = fs.readFileSync(`${__dirname}/swagger-saral-frontend.yaml`, 'utf-8');
const spec2 = fs.readFileSync(`${__dirname}/swagger-saral-maintenance.yaml`, 'utf-8');

const frontendSpec = yaml.load(spec);
const maintenanceSpec = yaml.load(spec2);
const app = express()

const loggerMiddleware = (req, res, next) => {
    console.log('New request to: ' + req.method + ' ' + req.path, req.body)
    next()
}

const generateJestReportPdf = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
        const invoicePath = path.resolve("./output/coverage/lcov-report/index.html");
    await page.goto(invoicePath, { waitUntil: 'networkidle0' });
    await page.pdf({
        path: './output/jestTestReport.pdf',
        displayHeaderFooter: true,
        headerTemplate: '',
        footerTemplate: '',
        printBackground: true,
        margin: {
            top: '20px', right: '20px', bottom: '20px', left: '20px'
    }
    });
        await browser.close();
    console.log("pdf printed")
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }))
app.use(express.json())
app.use(cors());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// Register the function as middleware for the application
app.use(loggerMiddleware)
app.use(schoolRouter)
app.use(studentRouter)
app.use(classRouter)
app.use(examRouter)
app.use(markRouter)
app.use(roiRouter)
app.use(brandRouter)
generateJestReportPdf() //generate jest report pdf
app.use("/api-docs/saral/frontend", swaggerUi.serve, (...args) => swaggerUi.setup(frontendSpec)(...args));
app.use("/api-docs/saral/maintenance", swaggerUi.serve, (...args) => swaggerUi.setup(maintenanceSpec)(...args));
module.exports = app