import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Forces the main window scroll to the top on route change
    window.scrollTo(0, 0); 
  }, [pathname]);

  return null;
}

export default ScrollToTop;