const { execSync } = require('child_process');
const os = require('os');

// Function to execute shell commands
function runCommand(command) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    process.exit(1);
  }
}

// Check if the operating system is macOS or Linux
const platform = os.platform();
if (platform === 'darwin' || platform === 'linux') {
  // Execute the command to fix permissions
  runCommand('chmod ug+x .husky/* && chmod ug+x .git/hooks/*');
} else {
  console.log('Operating system not supported for permission fix.');
}
