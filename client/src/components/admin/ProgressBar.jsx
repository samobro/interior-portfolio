import { useEffect, useState } from "react";

export function ProgressBar({ isLoading }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setProgress(0);

      const fast = setInterval(() => {
        setProgress((p) => {
          if (p >= 70) {
            clearInterval(fast);
            return p;
          }
          return p + 2;
        });
      }, 60);

      const slow = setTimeout(() => {
        const crawl = setInterval(() => {
          setProgress((p) => {
            if (p >= 90) {
              clearInterval(crawl);
              return p;
            }
            return p + 0.5;
          });
        }, 400);
      }, 2000);

      return () => {
        clearInterval(fast);
        clearTimeout(slow);
      };
    }

    setProgress(100);
    const hide = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 400);

    return () => clearTimeout(hide);
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1">
      <div
        className="h-full bg-amber-600 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
