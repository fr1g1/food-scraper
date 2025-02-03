import { renderToReadableStream } from 'react-dom/server'

import { scrapeRestaurants } from './scraper'
import type { Result } from './types'

export function Html({ data }: { data: Result[] }) {
    return (
        <html>
            <head>
                <title>Menu</title>
                <style>
                    {`
                        :root {
                            font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
                            line-height: 1.5;
                            font-weight: 400;

                            color: #222;
                            background-color: #ffffff;

                            font-synthesis: none;
                            text-rendering: optimizeLegibility;
                            -webkit-font-smoothing: antialiased;
                            -moz-osx-font-smoothing: grayscale;
                            -webkit-text-size-adjust: 100%;
                        }

                        body {
                            margin: 0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                        }

                        #app {
                            min-width: 1600px;
                            margin: 0 auto;
                        }

                        @media (max-width: 639px) {
                            #app {
                                margin: 2rem;
                            }
                        }

                        @media (prefers-color-scheme: dark) {
                            :root {
                                color: #ccc;
                                background-color: #1a1a1a;
                            }
                        }

                        tr:nth-child(even) {
                            background-color: #202222;
                        }

                        th {
                            background-color: #1b3f3f;
                        }

                        .foodName {
                            text-align: start;
                        }
                    `}
                </style>
            </head>
            <body>
                <div id='#app'>
                    <table>
                        {data?.map(({ name, data }) => (
                            <tbody key={name}>
                                <tr>
                                    <th colSpan={2}>
                                        {name}
                                    </th>
                                </tr>
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={2}>---</td>
                                    </tr>
                                ) : data.map(({ foodName, price }, i) => (
                                    <tr key={`${foodName}-${i}`}>
                                        <td className='.foodName'>
                                            {foodName}
                                        </td>
                                        <td>{price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        ))}
                    </table>
                </div>
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