import { load } from 'cheerio'

import {
    RequestType,
    type Restaurant,
    type Result,
    type ScrapedData,
} from './types'

const restaurants: Restaurant[] = [
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
        url: 'https://jidelna100chuti.cz/',
    },
    {
        name: 'Nepál',
        type: RequestType.NEPAL,
        url: 'https://nepalbrno.cz/poledni.php',
    },
]

const fetchSite = async (url: string) => {
    const response = await fetch(url)
    return response.text()
}

const parseBistro = async (request: Restaurant): Promise<Result> => {
    const siteData = await fetchSite(request.url)
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

const parseCanteen = async (request: Restaurant): Promise<Result> => {
    const siteData = await fetchSite(request.url)
    const $ = load(siteData)
    const data: ScrapedData[] = []

    const rowEls = [...$('.Hl'), ...$('.Po')]
    for (const rowEl of rowEls) {
        const foodName = $(rowEl).find('.jjjaz1jjj').text().replace(/\d*(?:,\d+)*$/, '').trim()
        const employeePrice = $(rowEl).find('.slcen2').text().replace(/,-/, '').trim()
        const externalPrice = $(rowEl).find('.slcen3').text().replace(/,-/, '').trim()
        data.push({ foodName, price: `${employeePrice} / ${externalPrice}` })
    }

    return {
        name: request.name,
        data,
    }
}

const parseCookpoint = async (request: Restaurant): Promise<Result> => {
    const siteData = await fetchSite(request.url)
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

const parseKanas = async (request: Restaurant): Promise<Result> => {
    const siteData = await fetchSite(request.url)
    const $ = load(siteData)
    const data: ScrapedData[] = []

    const rowEls = $('.menu-one-day').find('tr').filter((_, el) => $(el).children().is('td'))
    for (const rowEl of rowEls) {
        const foodName = $(rowEl).children('td').first().children('b').text().replace(/\d*(?:,\d+)*$/, '').trim()
        const price = $(rowEl).children('td').last().text().replace(/\sKč/, '').trim()
        if (foodName === '') {
            continue
        }
        data.push({ foodName, price })
    }
    return {
        name: request.name,
        data,
    }
}

const parseNepal = async (request: Restaurant): Promise<Result> => {
    const siteData = await fetchSite(request.url)
    const $ = load(siteData)
    const data: ScrapedData[] = []

    const now = new Date()
    const currentDate = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`

    const rowEls = $('.day-section')
        .filter((_, el) => $(el).find('.day-title').text().trim().includes(currentDate))
        .find('.menu-item')
    for (const rowEl of rowEls) {
        const foodName = $(rowEl).find('h3').text().trim()
        const price = $(rowEl).find('span').text().replace(/\sKč/, '').trim().split('.')[0]
        data.push({ foodName, price })
    }

    return {
        name: request.name,
        data,
    }
}

const parseData = (request: Restaurant) => {
    switch (request.type) {
        case RequestType.BISTRO:
            return parseBistro(request)
        case RequestType.CANTEEN:
            return parseCanteen(request)
        case RequestType.COOKPOINT:
            return parseCookpoint(request)
        case RequestType.KANAS:
            return parseKanas(request)
        case RequestType.NEPAL:
            return parseNepal(request)
    }
}

export const scrapeRestaurants = async () => {
    let response = []
    for (const restaurant of restaurants) {
        const parsed = await parseData(restaurant)
        response.push(parsed)
    }

    return response
}

