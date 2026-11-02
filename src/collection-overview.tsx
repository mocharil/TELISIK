import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, MessageSquareText, Network, ShieldAlert, Users } from 'lucide-react';
import type { Overview } from './types';
import { UiBadge, UiButton } from './ui-primitives';

export function CollectionOverview({ data }: { data: Overview }) {
  const maxTopic = Math.max(1, ...data.topic_counts.map(t => t.count));
  const stats = [
    {
      label: 'POST TERSIMPAN',
      value: data.posts.toLocaleString('id-ID'),
      sub: data.active_project ? `Tersaring di ${data.active_project.code}` : 'Total seluruh koleksi',
      icon: MessageSquareText,
    },
    {
      label: 'AKUN UNIK',
      value: data.authors.toLocaleString('id-ID'),
      sub: 'Partisipan berbeda (DID)',
      icon: Users,
    },
    {
      label: 'KATEGORI TOPIK',
      value: data.topics.toLocaleString('id-ID'),
      sub: 'Klasifikasi kata kunci',
      icon: Network,
    },
    {
      label: data.mode === 'snapshot' ? 'BALASAN KONTEKS' : 'POLA KOORDINASI',
      value: (data.mode === 'snapshot' ? data.context_posts || 0 : data.clusters).toLocaleString('id-ID'),
      sub: data.mode === 'snapshot' ? 'Reply & quote terkait' : 'Kandidat klaster waktu',
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="dw-overview-stack">
      <div className="dw-metrics-grid" aria-label="Ringkasan metrik koleksi">
        {stats.map(item => (
          <div key={item.label} className="dw-metric-box">
            <div className="dw-metric-top">
              <span>{item.label}</span>
              <item.icon size={15} />
            </div>
            <strong>{item.value}</strong>
            <small>{item.sub}</small>
          </div>
        ))}
      </div>

      <div className="lc-snapshot-grid">
        <section className="lc-panel">
          <header>
            <div>
              <h2>Kronologi Publikasi Post</h2>
              <p>
                {data.series_unit === 'month' ? 'Distribusi post per bulan' : 'Distribusi post per jam'} · Zona waktu WIB ·{' '}
                {data.mode === 'snapshot'
                  ? 'Sampel tangkapan publik'
                  : data.mode === 'live'
                  ? 'Koleksi live terfilter'
                  : 'Sampel simulasi project'}
              </p>
            </div>
            <UiBadge variant="code">{data.posts} REKAMAN</UiBadge>
          </header>
          {data.series.length ? (
            <div className="lc-volume">
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={data.series}>
                  <XAxis
                    dataKey="time"
                    tickFormatter={v =>
                      data.series_unit === 'month'
                        ? new Date(v).toLocaleDateString('id-ID', {
                            month: 'short',
                            year: '2-digit',
                            timeZone: 'Asia/Jakarta',
                          })
                        : new Date(v).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Jakarta',
                          })
                    }
                    minTickGap={50}
                    tick={{ fontSize: 11, fill: '#526583' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    width={35}
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#526583' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    labelFormatter={v =>
                      new Date(v).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB'
                    }
                  />
                  <Area
                    name="Post tersimpan"
                    type="monotone"
                    dataKey="posts"
                    stroke="#2457e7"
                    fill="#2457e7"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="lc-empty">Belum ada post tersimpan pada rentang waktu ini.</p>
          )}
        </section>

        <section className="lc-panel">
          <header>
            <div>
              <h2>Distribusi Topik Percakapan</h2>
              <p>Aturan pencocokan kata kunci transparan · satu kategori utama per post</p>
            </div>
          </header>
          <div className="lc-topic-list">
            {data.topic_counts.length ? (
              data.topic_counts.map(t => (
                <div key={t.topic}>
                  <span>{t.topic}</span>
                  <strong>{t.count} post</strong>
                  <i style={{ width: `${(t.count / maxTopic) * 100}%` }} />
                </div>
              ))
            ) : (
              <p className="lc-empty">Belum ada distribusi topik yang terdeteksi.</p>
            )}
          </div>
        </section>
      </div>

      <section className="lc-coverage">
        <div>
          <h2>Cakupan & Batasan Metodologi</h2>
          <p>
            Data di atas mencerminkan sampel post yang cocok dengan kata kunci pemantauan project beserta balasan langsungnya. Aktivitas di luar kata kunci atau percakapan privat tidak termasuk dalam perhitungan.
          </p>
        </div>
        <UiButton variant="primary" size="sm" href="#/collected">
          Telusuri Graf Interaksi <ArrowRight size={14} />
        </UiButton>
      </section>
    </div>
  );
}
