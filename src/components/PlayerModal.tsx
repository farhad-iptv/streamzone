import { useEffect, useRef, useState } from 'react';
import { SportsEvent, EventChannel } from '../types';
import { X, AlertCircle } from 'lucide-react';
import { cn } from '../utils';

interface PlayerModalProps {
  event: SportsEvent;
  onClose: () => void;
}

export function PlayerModal({ event, onClose }: PlayerModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<EventChannel | null>(event.channels_data?.[0] || null);
  const [activePlayer, setActivePlayer] = useState<'jw' | 'shaka' | 'videojs' | 'clappr'>('shaka');
  const [channelStatus, setChannelStatus] = useState<Record<string, { status: 'checking' | 'online' | 'offline', latency?: number }>>({});

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Check channel status and latency
  useEffect(() => {
    if (!event.channels_data) return;

    event.channels_data.forEach(async (channel) => {
      if (channelStatus[channel.link]) return; // Already checked

      setChannelStatus(prev => ({ ...prev, [channel.link]: { status: 'checking' } }));
      
      const startTime = performance.now();
      try {
        const checkUrl = channel.link.includes('.m3u8') ? `/api/proxy-stream?url=${encodeURIComponent(channel.link)}` : channel.link;
        const response = await fetch(checkUrl, { method: 'HEAD', cache: 'no-store' });
        const latency = Math.round(performance.now() - startTime);
        
        if (response.ok || response.type === 'opaque') {
          setChannelStatus(prev => ({ ...prev, [channel.link]: { status: 'online', latency } }));
        } else {
          setChannelStatus(prev => ({ ...prev, [channel.link]: { status: 'offline' } }));
        }
      } catch (error) {
        // Fallback for CORS issues, if fetch fails completely it might be offline or just blocked by CORS
        // We'll mark it as online with latency if we reached here but we can't be sure it's 404
        // A better approach for CORS blocked requests is to assume online if it's a network error due to CORS,
        // but it's hard to distinguish. We'll use a no-cors fallback to just get latency.
        try {
          const fbStart = performance.now();
          const fbCheckUrl = channel.link.includes('.m3u8') ? `/api/proxy-stream?url=${encodeURIComponent(channel.link)}` : channel.link;
          await fetch(fbCheckUrl, { mode: 'no-cors', cache: 'no-store' });
          const latency = Math.round(performance.now() - fbStart);
          setChannelStatus(prev => ({ ...prev, [channel.link]: { status: 'online', latency } }));
        } catch (e) {
          setChannelStatus(prev => ({ ...prev, [channel.link]: { status: 'offline' } }));
        }
      }
    });
  }, [event.channels_data]);

  useEffect(() => {
    if (!containerRef.current || !activeChannel) {
      if (!activeChannel) setError('No stream available for this event.');
      return;
    }

    let url = activeChannel.link;
    if (url.includes('.m3u8')) {
      url = `/api/proxy-stream?url=${encodeURIComponent(url)}`;
    }
    setError(null);

    // Clear previous children
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    let destroyPlayer: (() => void) | null = null;

    const hexToBase64Url = (hex: string) => {
      const bytes = new Uint8Array(Math.ceil(hex.length / 2));
      for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    };

    let clearkeyConfig: any = null;
    let licenseServer: string | null = null;
    
    // Check if api or tokenApi contains license URL
    const possibleLicenseUrls = [activeChannel.api, activeChannel.tokenApi].filter(Boolean) as string[];
    const httpLicenseUrl = possibleLicenseUrls.find(url => url.startsWith('http'));

    if (httpLicenseUrl) {
      licenseServer = httpLicenseUrl;
    } else if (activeChannel.api && url.includes('.mpd')) {
      // Try to parse KID:KEY
      let rawKid = '';
      let rawKey = '';
      
      try {
         // Maybe it's JSON? {"kid":"...","key":"..."} or keys: [...]
         if (activeChannel.api.startsWith('{')) {
           const parsed = JSON.parse(activeChannel.api);
           if (parsed.keys && parsed.keys.length > 0) {
             rawKid = parsed.keys[0].kid || parsed.keys[0].kty;
             rawKey = parsed.keys[0].k || parsed.keys[0].key;
           } else {
             rawKid = parsed.kid;
             rawKey = parsed.key || parsed.k;
           }
         } else {
           // Format like KID:KEY or KID KEY
           const parts = activeChannel.api.split(/[:\s|]/).filter(Boolean);
           if (parts.length >= 2) {
             rawKid = parts[0];
             rawKey = parts[1];
           }
         }
      } catch (e) {
         console.error('Failed to parse API DRM:', e);
      }

      if (rawKid && rawKey) {
        clearkeyConfig = {
          kid: hexToBase64Url(rawKid),
          k: hexToBase64Url(rawKey),
          rawKid: rawKid,
          rawKey: rawKey
        };
      }
    }

    if (activePlayer === 'jw') {
      const jwplayer = (window as any).jwplayer;
      if (!jwplayer) {
        setError('JW Player library not loaded. Please try again.');
        return;
      }

      const playerId = `jwplayer-${Math.random().toString(36).substring(7)}`;
      const playerContainer = document.createElement('div');
      playerContainer.id = playerId;
      containerRef.current.appendChild(playerContainer);

      const config: any = {
        file: url,
        width: "100%",
        height: "100%",
        autostart: true,
        mute: false,
      };

      if (url.includes('.mpd')) {
         config.type = 'dash';
      } else if (url.includes('.m3u8')) {
         config.type = 'hls';
      }

      if (clearkeyConfig) {
        config.drm = {
          clearkey: {
            keyId: clearkeyConfig.rawKid,
            key: clearkeyConfig.rawKey
          }
        };
      } else if (licenseServer) {
        config.drm = {
          widevine: { url: licenseServer },
          playready: { url: licenseServer }
        };
      }

      try {
        const playerInstance = jwplayer(playerId).setup(config);
        
        playerInstance.on('error', (e: any) => {
          console.error('JWPlayer Error', e);
          setError('Streaming error encountered.');
        });
        
        playerInstance.on('setupError', (e: any) => {
          console.error('JWPlayer Setup Error', e);
          setError('Player setup failed. Stream may be incompatible.');
        });
        
        destroyPlayer = () => {
          try {
            playerInstance.remove();
          } catch (e) {
            console.warn('Error removing player instance', e);
          }
        };
      } catch (e) {
        console.error('Failed to setup JWPlayer:', e);
        setError('Failed to initialize player.');
      }
    } else if (activePlayer === 'shaka') {
      const shaka = (window as any).shaka;
      if (!shaka) {
        setError('Shaka Player library not loaded.');
        return;
      }
      
      shaka.polyfill.installAll();
      if (!shaka.Player.isBrowserSupported()) {
        setError('Browser not supported by Shaka Player.');
        return;
      }

      const videoElement = document.createElement('video');
      videoElement.className = 'w-full h-full object-contain';
      videoElement.autoplay = true;
      videoElement.controls = true;
      videoElement.addEventListener('playing', () => setError(null));
      containerRef.current.appendChild(videoElement);

      const player = new shaka.Player(videoElement);
      
      if (clearkeyConfig) {
         player.configure({
           drm: {
             clearKeys: {
               [clearkeyConfig.rawKid]: clearkeyConfig.rawKey
             }
           }
         });
      } else if (licenseServer) {
         player.configure({
           drm: {
             servers: {
               'com.widevine.alpha': licenseServer,
               'com.microsoft.playready': licenseServer
             }
           }
         });
      }

      player.load(url).then(() => {
        console.log('Shaka stream loaded successfully');
      }).catch((e: any) => {
        console.error('Shaka Error', e);
        if (e.code !== 7002 && e.code !== 7000) {
          setError(`Shaka Player Error: ${e.message || e.code || 'Failed to load stream'}`);
        }
      });

      destroyPlayer = () => {
        player.destroy();
      };
    } else if (activePlayer === 'videojs') {
      const videojs = (window as any).videojs;
      if (!videojs) {
        setError('Video.js library not loaded.');
        return;
      }
      
      const videoElement = document.createElement('video');
      videoElement.className = 'video-js vjs-default-skin vjs-16-9 w-full h-full';
      videoElement.controls = true;
      videoElement.autoplay = true;
      videoElement.addEventListener('playing', () => setError(null));
      containerRef.current.appendChild(videoElement);
      
      try {
        const sourceConfig: any = { src: url, type: url.includes('.m3u8') ? 'application/x-mpegURL' : 'application/dash+xml' };
        
        if (clearkeyConfig) {
           sourceConfig.keySystems = {
             'org.w3.clearkey': {
               clearkeys: {
                 [clearkeyConfig.rawKid]: clearkeyConfig.rawKey
               }
             }
           };
        } else if (licenseServer) {
           sourceConfig.keySystems = {
             'com.widevine.alpha': { url: licenseServer },
             'com.microsoft.playready': { url: licenseServer }
           };
        }

        const player = videojs(videoElement, {
          sources: [sourceConfig]
        });
        
        destroyPlayer = () => {
          player.dispose();
        };
      } catch (e) {
        console.error('Video.js Error:', e);
        setError('Video.js initialization failed.');
      }
    } else if (activePlayer === 'clappr') {
      const Clappr = (window as any).Clappr;
      const DashShakaPlayback = (window as any).DashShakaPlayback;
      
      if (!Clappr) {
        setError('Clappr library not loaded.');
        return;
      }

      const playerId = `clappr-${Math.random().toString(36).substring(7)}`;
      const playerContainer = document.createElement('div');
      playerContainer.id = playerId;
      playerContainer.className = 'w-full h-full [&>div]:w-full [&>div]:h-full [&>div>div]:w-full [&>div>div]:h-full';
      containerRef.current.appendChild(playerContainer);

      const plugins = [];
      if (DashShakaPlayback) plugins.push(DashShakaPlayback);

      let shakaConfiguration = {};
      if (clearkeyConfig) {
         shakaConfiguration = {
           drm: {
             clearKeys: {
               [clearkeyConfig.rawKid]: clearkeyConfig.rawKey
             }
           }
         };
      } else if (licenseServer) {
         shakaConfiguration = {
           drm: {
             servers: {
               'com.widevine.alpha': licenseServer,
               'com.microsoft.playready': licenseServer
             }
           }
         };
      }

      try {
        const player = new Clappr.Player({
          source: url,
          parentId: `#${playerId}`,
          width: '100%',
          height: '100%',
          autoPlay: true,
          plugins: plugins,
          shakaConfiguration: shakaConfiguration
        });
        
        destroyPlayer = () => {
          player.destroy();
        };
      } catch (e) {
        console.error('Clappr error', e);
        setError('Clappr initialization failed.');
      }
    }

    return () => {
      if (destroyPlayer) destroyPlayer();
    };
  }, [activeChannel, activePlayer]);

  return (
    <div className="fixed inset-0 z-[200] bg-[#0a0a0f] flex flex-col md:flex-row">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col h-full bg-black relative">
        {/* Top Bar Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 md:p-6 z-20 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="flex flex-col pointer-events-auto">
            <h2 className="text-xl md:text-2xl font-bold text-white font-['Oswald'] uppercase tracking-wide">
              {event.eventInfo.teamA} <span className="text-[#e50914]">VS</span> {event.eventInfo.teamB}
            </h2>
            <p className="text-sm text-gray-300 font-medium">{event.eventInfo.eventName}</p>
          </div>
          <div className="flex items-center gap-3 pointer-events-auto flex-wrap justify-end max-w-[50%]">
            <div className="flex items-center gap-2">
              {(['shaka', 'jw', 'clappr', 'videojs'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setActivePlayer(p)}
                  className={cn(
                    "px-3 py-1 rounded-md text-[10px] md:text-xs font-bold uppercase transition-all border",
                    activePlayer === p
                      ? "bg-[#e50914] text-white border-[#e50914] shadow-[0_0_10px_rgba(229,9,20,0.3)]"
                      : "bg-black/40 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-white/10 rounded-full text-white hover:bg-[#e50914] transition-colors backdrop-blur-sm ml-2 shrink-0"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Video Container */}
        <div className="flex-1 relative w-full h-full flex items-center justify-center">
          <div ref={containerRef} className="w-full h-full absolute inset-0 flex items-center justify-center" />

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white p-8 z-10">
              <AlertCircle className="w-16 h-16 text-[#e50914] mb-4" />
              <h3 className="text-xl font-bold mb-2 font-['Oswald'] uppercase">Playback Error</h3>
              <p className="text-gray-400 text-center max-w-md mb-6">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar - Channels & Settings */}
      <div className={cn(
        "w-full md:w-[320px] lg:w-[380px] bg-[#111315] border-l border-white/5 flex flex-col h-[40vh] md:h-full overflow-y-auto z-30",
        "relative md:relative"
      )}>
        <div className="p-6 flex-1 flex flex-col gap-8">
          {/* Channels List */}
          {event.channels_data && event.channels_data.length > 0 && (
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#00d4ff] rounded-full"></span>
                Available Streams
              </h3>
              <div className="flex flex-col gap-2">
                {event.channels_data.map((channel, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveChannel(channel)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all w-full text-left",
                      activeChannel === channel
                        ? "bg-gradient-to-r from-[#1c3cd6]/20 to-[#0f2178]/20 border-[#1c3cd6]"
                        : "bg-[#1a1a24] border-transparent hover:border-white/10 hover:bg-[#2a2c2e]"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold",
                      activeChannel === channel ? "bg-[#1c3cd6] text-white" : "bg-white/5 text-gray-400"
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-sm font-bold truncate",
                          activeChannel === channel ? "text-white" : "text-gray-300"
                        )}>
                          {channel.title || `Stream ${idx + 1}`}
                        </span>
                        
                        {channelStatus[channel.link] && (
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              channelStatus[channel.link].status === 'online' ? "bg-green-500 shadow-[0_0_5px_#22c55e]" : 
                              channelStatus[channel.link].status === 'offline' ? "bg-red-500 shadow-[0_0_5px_#ef4444]" :
                              "bg-gray-500 animate-pulse"
                            )}></span>
                            {channelStatus[channel.link].status === 'online' && channelStatus[channel.link].latency !== undefined && (
                              <span className="text-[10px] text-gray-400 font-mono">{channelStatus[channel.link].latency}ms</span>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-500 uppercase font-medium">
                        {channel.link.includes('.mpd') ? 'DASH / DRM' : 'HLS Stream'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
