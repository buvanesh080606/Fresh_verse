import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import GlassContainer from '../../../components/ui/GlassContainer';
import { Bus, MapPin, Clock, ArrowRight, Search } from 'lucide-react';

const TransportView = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await api.get('core/bus-routes/');
        setRoutes(response.data);
      } catch (err) {
        console.error("Error fetching transport routes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  const filteredRoutes = routes.filter(
    (r) =>
      r.route_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.timings_json.some(t => t.stop.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-left p-2 max-w-7xl mx-auto">
      <div className="border-b border-brand-border/20 dark:border-brand-border-dark/20 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-brand-text dark:text-brand-text-dark">
            College Bus Routes & Timings
          </h2>
          <p className="text-sm text-brand-text/60 dark:text-brand-text-dark/60 mt-1">
            Track stops, pickup points, and schedules for college transport
          </p>
        </div>

        {/* Search Bus Stop */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/45" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search stops, sources, routes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border/90 dark:border-brand-border-dark/70 bg-white/80 dark:bg-brand-card-dark/80 text-xs text-brand-text dark:text-brand-text-dark input-focus-ring"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-brand-text/50 dark:text-brand-text-dark/50 mt-4">Loading transport directory...</p>
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div className="py-20 text-center text-brand-text/50 dark:text-brand-text-dark/50">
          <Bus className="w-12 h-12 mx-auto opacity-35 mb-2" />
          <p className="font-semibold text-sm">No matching transport routes found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRoutes.map((route) => (
            <GlassContainer key={route.id} className="space-y-4">
              <div className="flex items-center justify-between border-b border-brand-border/20 dark:border-brand-border-dark/25 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-accent/15 text-accent rounded-2xl">
                    <Bus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-brand-text dark:text-brand-text-dark text-lg">
                      Route {route.route_no}
                    </h3>
                    <p className="text-xs text-brand-text/60 dark:text-brand-text-dark/60 flex items-center gap-1.5 mt-0.5">
                      {route.source} <ArrowRight className="w-3.5 h-3.5" /> {route.destination}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stop Timeline */}
              <div className="space-y-4 relative pl-4 border-l-2 border-brand-border/40 dark:border-brand-border-dark/30 ml-3.5 py-1">
                {route.timings_json.map((stop, idx) => (
                  <div key={idx} className="relative flex items-center justify-between gap-4">
                    {/* Bullet dot */}
                    <div className="absolute -left-[22.5px] w-2.5 h-2.5 rounded-full bg-accent border-2 border-brand-bg dark:border-brand-bg-dark" />
                    
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-brand-text dark:text-brand-text-dark flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-brand-text/45" /> {stop.stop}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-accent bg-accent/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {stop.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassContainer>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransportView;
