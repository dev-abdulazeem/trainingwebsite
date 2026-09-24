import { useMemo, useRef, useEffect } from 'react';

// Detect provider from URL
function detectProvider(url) {
  if (!url) return null;
  if (/youtu\.be\/|youtube\.com\/(watch|shorts|embed)/i.test(url)) return 'youtube';
  if (/vimeo\.com\//i.test(url)) return 'vimeo';
  if (/drive\.google\.com\//i.test(url)) return 'google-drive';
  if (/\.m3u8($|\?)/i.test(url)) return 'hls';
  if (/\.(mp4|webm|ogg|mov|mkv|avi)($|\?)/i.test(url)) return 'direct';
  return 'direct'; // fallback: try a plain <video> tag
}

function toEmbedUrl(url, provider) {
  try {
    if (provider === 'youtube') {
      const m =
        url.match(/youtu\.be\/([^?&]+)/) ||
        url.match(/[?&]v=([^?&]+)/) ||
        url.match(/shorts\/([^?&]+)/) ||
        url.match(/embed\/([^?&]+)/);
      return m ? `https://www.youtube.com/embed/${m[1]}` : url;
    }
    if (provider === 'vimeo') {
      const m = url.match(/vimeo\.com\/(\d+)/);
      return m ? `https://player.vimeo.com/video/${m[1]}` : url;
    }
    if (provider === 'google-drive') {
      const m = url.match(/\/d\/([^/]+)/);
      return m ? `https://drive.google.com/file/d/${m[1]}/preview` : url;
    }
  } catch {
    return url;
  }
  return url;
}

export default function VideoPlayer({ url, className = '' }) {
  const provider = useMemo(() => detectProvider(url), [url]);
  const videoRef = useRef(null);

  // HLS support via hls.js (npm install hls.js)
  useEffect(() => {
    if (provider === 'hls' && videoRef.current) {
      if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = url; // Safari native HLS
      } else {
        import('hls.js').then(({ default: Hls }) => {
          if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(videoRef.current);
          }
        });
      }
    }
  }, [provider, url]);

  if (!url) {
    return (
      <div className={`bg-dark-800 rounded-xl flex items-center justify-center aspect-video ${className}`}>
        <p className="text-dark-500">No video available for this lesson yet.</p>
      </div>
    );
  }

  // Uploaded videos served as HLS (Cloudinary eager m3u8)
  if (provider === 'hls') {
    return (
      <video
        ref={videoRef}
        controls
        className={`w-full aspect-video bg-black rounded-xl ${className}`}
      />
    );
  }

  // Uploaded videos served as direct mp4/webm
  if (provider === 'direct') {
    return (
      <video
        src={url}
        controls
        className={`w-full aspect-video bg-black rounded-xl ${className}`}
      />
    );
  }

  // External link → embed in an iframe
  return (
    <iframe
      src={toEmbedUrl(url, provider)}
      title="Lesson video"
      className={`w-full aspect-video bg-black rounded-xl ${className}`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      referrerPolicy="no-referrer"
    />
  );
}