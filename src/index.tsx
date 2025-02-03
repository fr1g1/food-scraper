import { renderToReadableStream } from 'react-dom/server'

import { scrapeRestaurants } from './scraper'
import type { Result } from './types'

export function Row({ foodName, price, transparent }: { foodName: string, price?: string, transparent: boolean }) {
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
                            ? data.map(({ foodName, price }, i) => <Row key={i} foodName={foodName} price={price} transparent={i % 2 !== 0} />)
                            : <Row foodName="---" transparent={false} />
                        }
                    </div>
                ))}
            </body>
        </html>
    )
}

Bun.serve({
    port: 3000,
    fetch: async () => {
        const data = await scrapeRestaurants()
        const html = await renderToReadableStream(<Html data={data} />)

        return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    },
})