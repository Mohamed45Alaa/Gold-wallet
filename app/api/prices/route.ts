import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const [xauRes, usdRes] = await Promise.all([
            fetch('https://sa.investing.com/currencies/xau-usd', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://www.google.com/',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'cross-site',
                    'Sec-Fetch-User': '?1',
                    'Upgrade-Insecure-Requests': '1'
                }
            }),
            fetch('https://gold-price-live.com/view/sagha-usd', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            })
        ]);

        let xauPrice = 0;
        let usdRate = 0;

        // Parse XAU/USD
        if (xauRes.ok) {
            const html = await xauRes.text();
            const $ = cheerio.load(html);
            const priceText = $('[data-test="instrument-price-last"]').text().trim();
            xauPrice = parseFloat(priceText.replace(/,/g, '')) || 0;
        }

        // Parse USD/EGP (Sagha)
        if (usdRes.ok) {
            const html = await usdRes.text();
            const $ = cheerio.load(html);
            const priceDiv = $('div.mb-5').filter((i, el) => {
                const style = $(el).attr('style');
                return style?.includes('font-size:120px') ?? false;
            });
            const priceText = priceDiv.text().trim();
            usdRate = parseFloat(priceText.replace(/,/g, '')) || 0;
        }

        return NextResponse.json({
            xauPrice,
            usdRate,
            timestamp: Date.now(),
            status: 'success'
        });

    } catch (error) {
        console.error('Scraping Error:', error);
        return NextResponse.json({
            xauPrice: 0,
            usdRate: 0,
            status: 'error',
            message: 'Failed to fetch prices'
        }, { status: 500 });
    }
}
