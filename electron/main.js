const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow = null;
let backendProcess = null;
let frontendProcess = null;

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

async function startBackendServer() {
  if (isDev) {
    const { spawn } = require('child_process');
    log('Starting backend server...');
    
    backendProcess = spawn('npm', ['run', 'backend:dev'], {
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe']
    });
    
    backendProcess.stdout.on('data', (data) => {
      log('[Backend]', data.toString().trim());
    });

    backendProcess.stderr.on('data', (data) => {
      log('[Backend Error]', data.toString().trim());
    });
    
    backendProcess.on('error', (err) => {
      log('[Backend Error]', err.message);
      app.quit();
    });

    // Give the backend some time to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    log('Backend server started');
  }
}

async function startFrontendServer() {
  if (isDev) {
    const { spawn } = require('child_process');
    log('Starting frontend server...');
    
    frontendProcess = spawn('npm', ['run', 'frontend:dev'], {
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe']
    });
    
    frontendProcess.stdout.on('data', (data) => {
      log('[Frontend]', data.toString().trim());
    });

    frontendProcess.stderr.on('data', (data) => {
      log('[Frontend Error]', data.toString().trim());
    });
    
    frontendProcess.on('error', (err) => {
      log('[Frontend Error]', err.message);
      app.quit();
    });

    // Give the frontend some time to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    log('Frontend server started');
  }
}

async function createWindow() {
  log('Creating main window...');
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, '../client/public/favicon.ico'),
    show: false // Don't show until ready-to-show
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3090'); // Development server
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../client/dist/index.html')); // Production build
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    log('Main window is ready and visible');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    log('Main window closed');
  });
}

// Initialize app
app.whenReady().then(async () => {
  try {
    log('Initializing app...');
    if (isDev) {
      await startBackendServer();
      await startFrontendServer();
    }
    await createWindow();
    log('App initialization complete');
  } catch (err) {
    log('Failed to initialize app:', err);
    app.quit();
  }
});

// Cleanup when quitting
app.on('before-quit', () => {
  log('App is quitting, cleaning up...');
  if (backendProcess) {
    backendProcess.kill();
  }
  if (frontendProcess) {
    frontendProcess.kill();
  }
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    log('All windows closed, quitting app');
    app.quit();
  }
});

// On macOS, re-create window when dock icon is clicked
app.on('activate', async () => {
  if (!mainWindow) {
    log('Reactivating app, creating new window');
    await createWindow();
  }
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  log('Uncaught exception:', error);
});

// Cleanup on exit
process.on('exit', () => {
  log('Process exiting, cleaning up...');
  if (backendProcess) {
    backendProcess.kill();
  }
  if (frontendProcess) {
    frontendProcess.kill();
  }
});

process.on('SIGINT', () => {
  log('Received SIGINT signal, quitting app');
  app.quit();
});
