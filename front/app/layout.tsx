'use client';
import './global.scss';
import Sidebar from './components/sidebar';
import { ThemeProvider } from '@emotion/react';
import { PaperbaseTheme } from './theme/paperbase';
import Header from './components/header';
import { Box, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import { useAuthStore } from './stores/auth.store';
import Login from './login/page';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const drawerWidth = 256;
  return (
    <>
      <html>
        <body>
          {user ? (
            <>
              <ThemeProvider theme={PaperbaseTheme}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                    <CssBaseline />
                    <Box
                      component="nav"
                      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                    >
                      <Sidebar
                        PaperProps={{ style: { width: drawerWidth } }}
                        sx={{ display: { sm: 'block', xs: 'none' } }}
                      />
                    </Box>
                    <Box
                      sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                    >
                      <Header />
                      <Box
                        component="main"
                        sx={{ flex: 1, py: 6, px: 4, bgcolor: '#eaeff1' }}
                      >
                        <div className="content">{children}</div>
                      </Box>
                    </Box>
                  </Box>

                  <ToastContainer
                    position="bottom-left"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="light"
                  />
                </LocalizationProvider>
              </ThemeProvider>
            </>
          ) : (
            <>
              <Login />
            </>
          )}
        </body>
      </html>
    </>
  );
}
