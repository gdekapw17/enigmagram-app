import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './globals.css';

import App from './App';
import AuthProvider from './context/AuthContext';
import QueryProvider from './lib/tanstack-query/QueryProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <QueryProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryProvider>
  </BrowserRouter>,
);
