import { renderToString } from 'react-dom/server'

import { scrapeRestaurants } from './scraper'
import type { Result, ScrapedData } from './types'

export function Row({ data, transparent }: { data: ScrapedData, transparent: boolean }) {
    const { foodName, price } = data
    return (
        <div
            style={{
                alignItems: 'stretch',
                backgroundColor: transparent ? 'transparent' : '#222222',
                display: 'flex',
                flex: 1,
                fontSize: 18,
                justifyContent: 'space-between',
                padding: 2
            }}>
            <span>{foodName}</span>
            {price !== undefined && <span>{price}</span>}
        </div>
    )
}

export function Html({ data }: { data: Result[] }) {
    return (
        <html>
            <head>
                <title>Menu</title>
                <style>
                    {`
                        :root {
                            color: #ccc;
                            background-color: #1a1a1a;
                        }
                    `}
                </style>
            </head>
            <body>
                {data.map(({ name, data }) => (
                    <div key={name} style={{ alignItems: 'stretch', width: 1000 }}>
                        <h2 style={{ backgroundColor: '#1b3f3f', marginBottom: 4 }}>{name}</h2>
                        {data.length > 0
                            ? data.map((scrapedData, i) => <Row key={i} data={scrapedData} transparent={i % 2 !== 0} />)
                            : <Row data={{ foodName: "---", price: undefined }} transparent={false} />
                        }
                    </div>
                ))}
            </body>
        </html>
    )
}

Bun.serve({
    port: 3000,
    routes: {
        '/': async () => {
            const data = await scrapeRestaurants()
            const html = renderToString(<Html data={data} />)

            return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
        }
    }
})