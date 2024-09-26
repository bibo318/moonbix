import chalk from 'chalk';

//todo Function random agent
export const getRandomUserAgent = () => {
  const user_agents = [
    "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 11; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 12; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.62 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 11; OnePlus 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 10; Redmi Note 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36"
  ]

  return user_agents[Math.floor(Math.random() * user_agents.length)];
};

//todo Function to check if proxy is valid
export const checkProxy = async (session) => {
  try {
    const response = await session('https://api.ipify.org?format=json');
    const data = await response.json();
    log(`Proxy IP: ${data.ip}`, 'success');
    return data.ip;
  } catch (error) {
    log(`Error checking proxy IP: ${error.message}`, 'error');
    return 'Direct';
  }
};

//todo Utility to log messages with color
export const log = (message, name = 'BOT', type = 'default') => {
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = {
    success: `| Moonbix | ${name} | [${timestamp}] ${chalk.green(message)}`,
    error: `| Moonbix | ${name} | [${timestamp}] ${chalk.red(message)}`,
    warning: `| Moonbix | ${name} | [${timestamp}] ${chalk.yellow(message)}`,
    info: `| Moonbix | ${name} | [${timestamp}] ${chalk.cyan(message)}`,
    custom: `| Moonbix | ${name} | [${timestamp}] ${chalk.magenta(message)}`,
    default: `| Moonbix | ${name} | [${timestamp}] ${message}`,
  }[type] || `| Moonbix | ${name} | [${timestamp}] ${message}`;
  console.log(logMessage);
};

//todo Utility to add a delay
export const delay = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

//todo Utility to log a message and then add a delay
export const logDelay = async (message, ms, name, type = 'info') => {
  log(message, name, type);
  await delay(ms);
};
