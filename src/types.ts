export type Restaurant = {
    name: string
    type: RequestType
    url: string
}

export type ScrapedData = {
    foodName: string
    price: string
}

export type Result = {
    name: string
    data: ScrapedData[]
}

export const enum RequestType {
    BISTRO = 'bistro',
    CANTEEN = 'canteen',
    COOKPOINT = 'cookpoint',
    KANAS = 'kanas',
}