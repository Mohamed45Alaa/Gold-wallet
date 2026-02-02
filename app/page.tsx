import { RealtimeInitializer } from '@/components/RealtimeInitializer';
import { Hero } from '@/components/Hero';
import { MarketTicker } from '@/components/MarketTicker';
import { SummaryCards } from '@/components/SummaryCards';
import { GoldTable } from '@/components/GoldTable';
import { CashManagement } from '@/components/CashManagement';

import { ScrollReset } from '@/components/ScrollReset';

export default function Home() {
  return (
    <>
      {/* 
          Duplicate RealtimeInitializer removed (handled in layout)
          ScrollReset removed (handled in layout)
      */}

      <div className="space-y-8">
        {/* Top Hero Section (Dominant) */}
        <section>
          <Hero />
        </section>

        {/* Live Market Data */}
        <section>
          <MarketTicker />
        </section>

        {/* Summary Cards */}
        <section>
          <SummaryCards />
        </section>

        {/* Main Content Areas */}
        <div className="space-y-12">
          {/* Gold Table Section */}
          <section>
            <GoldTable />
          </section>

          {/* Cash Management Section */}
          <section>
            <h3 className="text-xl font-semibold mb-4">إدارة السيولة</h3>
            <CashManagement />
          </section>
        </div>
      </div>
    </>
  );
}
