'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';

/**
 * 18 centrales nucléaires actives en France.
 * Coordonnées x,y calibrées sur un viewBox SVG de 500x520.
 */
const PLANTS_MAP_DATA = [
  // 900 MW — Bleu
  { name: 'Gravelines', reactors: 6, x: 262, y: 30, category: '900' as const, department: 'Nord' },
  { name: 'Dampierre', reactors: 4, x: 268, y: 192, category: '900' as const, department: 'Loiret' },
  { name: 'St-Laurent-des-Eaux', reactors: 2, x: 228, y: 200, category: '900' as const, department: 'Loir-et-Cher' },
  { name: 'Chinon', reactors: 4, x: 200, y: 218, category: '900' as const, department: 'Indre-et-Loire' },
  { name: 'Blayais', reactors: 4, x: 140, y: 330, category: '900' as const, department: 'Gironde' },
  { name: 'Tricastin', reactors: 4, x: 325, y: 370, category: '900' as const, department: 'Drôme' },
  { name: 'Cruas', reactors: 4, x: 318, y: 350, category: '900' as const, department: 'Ardèche' },
  { name: 'Bugey', reactors: 4, x: 355, y: 290, category: '900' as const, department: 'Ain' },

  // 1300 MW — Orange
  { name: 'Paluel', reactors: 4, x: 218, y: 70, category: '1300' as const, department: 'Seine-Maritime' },
  { name: 'Flamanville', reactors: 2, x: 118, y: 85, category: '1300' as const, department: 'Manche' },
  { name: 'Penly', reactors: 2, x: 248, y: 62, category: '1300' as const, department: 'Seine-Maritime' },
  { name: 'Cattenom', reactors: 4, x: 380, y: 100, category: '1300' as const, department: 'Moselle' },
  { name: 'Belleville', reactors: 2, x: 290, y: 205, category: '1300' as const, department: 'Cher' },
  { name: 'Nogent-sur-Seine', reactors: 2, x: 305, y: 148, category: '1300' as const, department: 'Aube' },
  { name: 'Saint-Alban', reactors: 2, x: 335, y: 320, category: '1300' as const, department: 'Isère' },
  { name: 'Golfech', reactors: 2, x: 220, y: 395, category: '1300' as const, department: 'Tarn-et-Garonne' },

  // 1450 MW — Or
  { name: 'Chooz', reactors: 2, x: 345, y: 48, category: '1450' as const, department: 'Ardennes' },
  { name: 'Civaux', reactors: 2, x: 200, y: 280, category: '1450' as const, department: 'Vienne' },
];

const CATEGORY_COLORS = {
  '900': { bg: '#2563EB', glow: '#93C5FD', label: '900 MW' },
  '1300': { bg: '#EA580C', glow: '#FDBA74', label: '1 300 MW' },
  '1450': { bg: '#F59E0B', glow: '#FDE68A', label: '1 450 MW' },
} as const;

export default function FranceNuclearMap() {
  const [hoveredPlant, setHoveredPlant] = useState<string | null>(null);

  return (
    <div className="w-full">
      {/* Titre */}
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">
          Les centrales nucléaires en France
        </h2>
        <p className="text-gray-500 mt-3 text-lg">
          Survolez un point pour voir le détail, cliquez pour trouver un logement
        </p>
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-10">
        {/* === CARTE SVG === */}
        <div className="relative w-full lg:w-3/5 max-w-[520px] mx-auto lg:mx-0 flex-shrink-0">
          <svg
            viewBox="0 0 500 520"
            className="w-full h-auto"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Ombre douce sous la carte */}
              <filter id="mapShadow" x="-5%" y="-5%" width="110%" height="110%">
                <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.08" />
              </filter>
              {/* Dégradé du fond de carte */}
              <linearGradient id="mapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E8F0FE" />
                <stop offset="100%" stopColor="#D1E0F0" />
              </linearGradient>
            </defs>

            {/* Contour de la France — forme simplifiée et lissée */}
            <path
              d="M205 8 C215 5, 235 5, 250 10 C260 8, 275 12, 290 10
                 C305 14, 315 10, 330 18 C342 14, 352 18, 362 25
                 C375 22, 385 28, 395 38 C405 48, 398 58, 400 70
                 C402 82, 395 92, 390 102 C385 108, 378 105, 370 112
                 C362 118, 360 125, 365 135 C370 142, 378 140, 385 148
                 C390 155, 388 162, 382 170 C376 176, 368 172, 362 178
                 C355 185, 350 195, 355 208 C360 218, 365 225, 368 238
                 C372 248, 374 258, 370 270 C368 280, 372 290, 370 302
                 C368 312, 370 322, 365 332 C360 342, 355 350, 348 360
                 C340 370, 332 378, 322 385 C312 392, 302 398, 290 405
                 C278 410, 268 418, 255 422 C242 428, 230 430, 218 428
                 C206 425, 195 420, 185 415 C172 408, 162 400, 152 390
                 C142 378, 132 368, 125 355 C118 342, 115 330, 118 318
                 C120 305, 116 292, 112 280 C108 268, 105 255, 108 242
                 C110 230, 108 218, 102 205 C98 195, 95 182, 92 170
                 C90 158, 88 145, 92 132 C95 120, 90 108, 88 95
                 C86 82, 90 70, 95 60 C100 50, 108 42, 118 35
                 C128 28, 138 22, 150 18 C162 14, 172 12, 185 10
                 C195 8, 200 8, 205 8 Z"
              fill="url(#mapGrad)"
              stroke="#A8C4DE"
              strokeWidth="1.5"
              strokeLinejoin="round"
              filter="url(#mapShadow)"
            />

            {/* Points des centrales */}
            {PLANTS_MAP_DATA.map((plant) => {
              const color = CATEGORY_COLORS[plant.category];
              const isHovered = hoveredPlant === plant.name;

              return (
                <g key={plant.name}>
                  {/* Halo d'animation au hover */}
                  {isHovered && (
                    <>
                      <circle
                        cx={plant.x}
                        cy={plant.y}
                        r="18"
                        fill="none"
                        stroke={color.bg}
                        strokeWidth="2"
                        opacity="0.2"
                        className="animate-ping"
                      />
                      <circle
                        cx={plant.x}
                        cy={plant.y}
                        r="14"
                        fill={color.glow}
                        opacity="0.25"
                      />
                    </>
                  )}
                  {/* Point principal */}
                  <circle
                    cx={plant.x}
                    cy={plant.y}
                    r={isHovered ? '10' : '8'}
                    fill={color.bg}
                    stroke="white"
                    strokeWidth="3"
                    className="cursor-pointer"
                    style={{ transition: 'all 0.2s ease' }}
                    onMouseEnter={() => setHoveredPlant(plant.name)}
                    onMouseLeave={() => setHoveredPlant(null)}
                  />
                  {/* Petit cercle blanc au centre */}
                  <circle
                    cx={plant.x}
                    cy={plant.y}
                    r="2.5"
                    fill="white"
                    className="pointer-events-none"
                    opacity={isHovered ? 0 : 0.6}
                  />
                </g>
              );
            })}
          </svg>

          {/* Zones cliquables invisibles + tooltips en overlay HTML */}
          <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
            {PLANTS_MAP_DATA.map((plant) => {
              const isHovered = hoveredPlant === plant.name;
              const color = CATEGORY_COLORS[plant.category];
              const leftPct = (plant.x / 500) * 100;
              const topPct = (plant.y / 520) * 100;

              return (
                <Link
                  key={plant.name}
                  href={`/listings?search=${encodeURIComponent(plant.name)}`}
                  className="absolute rounded-full"
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '32px',
                    height: '32px',
                    pointerEvents: 'auto',
                    zIndex: isHovered ? 50 : 10,
                  }}
                  onMouseEnter={() => setHoveredPlant(plant.name)}
                  onMouseLeave={() => setHoveredPlant(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div
                      className="absolute z-50 bg-white rounded-2xl shadow-2xl p-4 animate-fade-in
                                  border border-gray-100/80 backdrop-blur-sm"
                      style={{
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: '10px',
                        minWidth: '200px',
                        pointerEvents: 'none',
                      }}
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: color.bg }}
                        />
                        <span className="font-heading font-bold text-[15px] text-gray-900">
                          {plant.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-2.5">
                        <MapPin size={11} />
                        <span>{plant.department}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${color.bg}15`, color: color.bg }}
                        >
                          {plant.reactors} réacteur{plant.reactors > 1 ? 's' : ''}
                        </span>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                        >
                          {color.label}
                        </span>
                      </div>
                      <div className="pt-2.5 border-t border-gray-100 flex items-center gap-1">
                        <span className="text-xs text-primary font-bold">Voir les logements</span>
                        <ChevronRight size={12} className="text-primary" />
                      </div>
                      {/* Flèche */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0
                                    border-l-[7px] border-l-transparent
                                    border-r-[7px] border-r-transparent
                                    border-t-[7px] border-t-white"
                        style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}
                      />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Légende sous la carte */}
          <div className="flex flex-wrap items-center justify-center gap-5 mt-6">
            {Object.entries(CATEGORY_COLORS).map(([key, val]) => {
              const count = PLANTS_MAP_DATA.filter(p => p.category === key);
              const totalReactors = count.reduce((sum, p) => sum + p.reactors, 0);
              return (
                <div key={key} className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full shadow-sm"
                    style={{ backgroundColor: val.bg }}
                  />
                  <span className="text-sm font-semibold text-gray-700">{val.label}</span>
                  <span className="text-xs text-gray-400">({totalReactors} réacteurs)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* === PANNEAU LATÉRAL === */}
        <div className="w-full lg:w-2/5 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: '18', label: 'Centrales', color: 'blue' },
              { value: '56', label: 'Réacteurs', color: 'orange' },
              { value: '13', label: 'Régions', color: 'amber' },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`bg-${stat.color}-50 rounded-2xl p-4 text-center`}
              >
                <p className={`text-2xl font-heading font-bold text-${stat.color}-600`}>{stat.value}</p>
                <p className={`text-xs text-${stat.color}-600/70 font-medium mt-1`}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Liste des centrales */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-heading font-bold text-gray-800 text-sm uppercase tracking-wider">
                Trouver un logement par centrale
              </h3>
            </div>
            <div className="max-h-[440px] overflow-y-auto">
              {PLANTS_MAP_DATA
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((plant) => {
                  const color = CATEGORY_COLORS[plant.category];
                  const isHovered = hoveredPlant === plant.name;
                  return (
                    <Link
                      key={plant.name}
                      href={`/listings?search=${encodeURIComponent(plant.name)}`}
                      className={`
                        flex items-center justify-between px-5 py-3.5
                        transition-all duration-150 group border-b border-gray-50 last:border-0
                        ${isHovered ? 'bg-primary/[0.04]' : 'hover:bg-gray-50/80'}
                      `}
                      onMouseEnter={() => setHoveredPlant(plant.name)}
                      onMouseLeave={() => setHoveredPlant(null)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm transition-transform duration-150"
                          style={{
                            backgroundColor: color.bg,
                            transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                          }}
                        />
                        <div>
                          <span
                            className={`text-sm font-medium block transition-colors ${
                              isHovered ? 'text-primary font-semibold' : 'text-gray-800'
                            }`}
                          >
                            {plant.name}
                          </span>
                          <span className="text-xs text-gray-400">{plant.department}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${color.bg}12`, color: color.bg }}
                        >
                          {plant.reactors} réacteurs
                        </span>
                        <ChevronRight
                          size={14}
                          className={`transition-all duration-150 ${
                            isHovered ? 'text-primary translate-x-0.5' : 'text-gray-300'
                          }`}
                        />
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
