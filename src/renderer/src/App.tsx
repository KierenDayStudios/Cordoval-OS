
import { UserProvider, useUser } from './context/UserContext';
import { FileSystemProvider } from './components/FileSystem';
import { Desktop } from './components/Desktop';
import { LoginScreen } from './components/LoginScreen';
import './App.css';

// --- TypeScript Definitions ---
declare global {
  interface Window {
    require: any;
  }
}

// --- Main Layout Component ---
const MainLayout = () => {
  const { currentUser } = useUser();

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <FileSystemProvider userId={currentUser.id}>
      <Desktop />
    </FileSystemProvider>
  );
};

// --- Root App Switcher ---
function App() {
  return (
    <UserProvider>
      <MainLayout />
    </UserProvider>
  );
}

export default App;