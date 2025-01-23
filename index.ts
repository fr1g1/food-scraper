import { load } from 'npm:cheerio@1.0.0'

type Request = {
    name: string
    type: RequestType
    url: string
}

type ScrapedData = {
    foodName: string
    price: string
}

type Parsed = {
    name: string
    data: ScrapedData[]
}

const enum RequestType {
    BISTRO = 'bistro',
    CANTEEN = 'canteen',
    COOKPOINT = 'cookpoint',
    KANAS = 'kanas',
}

const restaurants: Request[] = [
    {
        name: 'Bistro 22',
        type: RequestType.BISTRO,
        url: 'https://bistro22.cz',
    },
    {
        name: 'Menza Mozzarella',
        type: RequestType.CANTEEN,
        url: 'https://www.kam.vutbr.cz/21default.aspx?p=menu&provoz=18',
    },
    {
        name: 'Menza Kolejní',
        type: RequestType.CANTEEN,
        url: 'https://www.kam.vutbr.cz/21default.aspx?p=menu&provoz=20',
    },
    {
        name: 'Cookpoint',
        type: RequestType.COOKPOINT,
        url: 'http://www.cookpoint.cz',
    },
    {
        name: 'Kanas',
        type: RequestType.KANAS,
        url: 'http://www.kanas.cz/stranka/jidelna',
    },
]

const scrapeSite = async (url: string) => {
    const response = await fetch(url)
    return response.text()
}

const parseBistro = async (request: Request): Promise<Parsed> => {
    const siteData = await scrapeSite(request.url)
    const $ = load(siteData)
    const data: ScrapedData[] = []

    const dayInWeek = new Date().getDay() - 1
    const rowEls = $('.menu-list_item-row').slice(dayInWeek * 3, dayInWeek * 3 + 3) // Each day has 3 rows
    for (const rowEl of rowEls) {
        const foodName = $(rowEl).find('.menu-list_item-name').contents().filter((_, el) => !$(el).is('small')).text().trim()
        const price = $(rowEl).find('.menu-list_item-price').text().replace(/\sKč/, '').trim()
        data.push({ foodName, price })
    }

    return {
        name: request.name,
        data,
    }
}

const parseCanteen = async (request: Request): Promise<Parsed> => {
    const siteData = await scrapeSite(request.url)
    const $ = load(siteData)
    const data: ScrapedData[] = []

    const rowEls = [...$('.Hl'), ...$('.Po')]
    for (const rowEl of rowEls) {
        const foodName = $(rowEl).find('.jjjaz1jjj').text().replace(/\d*(?:,\d+)*$/, '').trim()
        const price = $(rowEl).find('.slcen2').text().replace(/,-/, '').trim()
        data.push({ foodName, price })
    }

    return {
        name: request.name,
        data,
    }
}

const parseCookpoint = async (request: Request): Promise<Parsed> => {
    const siteData = await scrapeSite(request.url)
    const $ = load(siteData)
    const data: ScrapedData[] = []

    const rowEls = $('tr')
    for (const rowEl of rowEls) {
        const mainFood = $(rowEl).find('.mname').text().trim()
        const dish = $(rowEl).find('small').contents().filter((_, el) => !$(el).is('strong')).text().replace(/\(.*\)/, '').trim()
        const price = $(rowEl).find('.price').text().replace(/\sKč/, '').trim()
        const foodName = `${mainFood}${dish !== '' ? `, ${dish}` : ''}`
        data.push({ foodName, price })
    }

    return {
        name: request.name,
        data,
    }
}

const parseKanas = async (request: Request): Promise<Parsed> => {
    const siteData = await scrapeSite(request.url)
    const $ = load(siteData)
    const data: ScrapedData[] = []

    const rowEls = $('.polozka')
    for (const rowEl of rowEls) {
        const foodName = $(rowEl).find('.jidlo').text().replace(/\d*(?:,\d+)*$/, '').trim()
        const price = $(rowEl).find('.cena').text().replace(/,-/, '').trim()
        if (foodName === '----') {
            continue
        }
        data.push({ foodName, price })
    }

    return {
        name: request.name,
        data,
    }
}

const parseData = (request: Request) => {
    switch (request.type) {
        case RequestType.BISTRO:
            return parseBistro(request)
        case RequestType.CANTEEN:
            return parseCanteen(request)
        case RequestType.COOKPOINT:
            return parseCookpoint(request)
        case RequestType.KANAS:
            return parseKanas(request)
    }
}

const generateHtml = async () => {
    let response = '<!DOCTYPE html><html><head><title>Menu</title></head><body><div>'
    for (const restaurant of restaurants) {
        const parsed = await parseData(restaurant)
        response += `<table style="border: 1px solid; margin-bottom: 10px;"><thead><tr><th colspan="2" style="border-bottom: 1px solid;">${parsed.name}</th></tr></thead><tbody>`
        for (const item of parsed.data) {
            response += `<tr><td>${item.foodName}</td><td>${item.price}</td></tr>`
        }
        response += `</tbody></table>`
    }
    response += '</div></body></html>'

    return response
}

Deno.serve({ port: 3000 }, async () => {
    const html = await generateHtml()
    return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })
})
