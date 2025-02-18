import React, { useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface MobileRedirectProps {
    children: ReactNode;
}

const MobileRedirect: React.FC<MobileRedirectProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
                        window.innerWidth <= 768;

        if (isMobile && location.pathname === '/') {
            navigate('/bot', { replace: true });
            return;
        }
    }, [navigate, location]);

    return <>{children}</>;
};

export default MobileRedirect;
