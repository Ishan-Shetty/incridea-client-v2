import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes.tsx'

import { SocketProvider } from './context/SocketContext'

function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <AppRoutes />
      </SocketProvider>
    </BrowserRouter>
  )
}

export default App
