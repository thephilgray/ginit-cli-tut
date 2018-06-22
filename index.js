#!/usr/bin/env node

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');

const files = require('./lib/files');
const inquirer = require('./lib/inquirer.js');
const github = require('./lib/github.js');
const repo = require('./lib/repo.js');

clear();
console.log(
  chalk.yellow(figlet.textSync('Ginit', { horizontalLayout: 'full' }))
);

if (files.directoryExists('.git')) {
  console.log(chalk.red('Already a git repo!'));
  process.exit();
}

const getGithubToken = async () => {
  let token = github.getStoredGithubToken();
  if (token) {
    return token;
  }

  try {
    await github.setGithubCredentials();

    token = await github.registerNewToken();
    return token;
  } catch (err) {
    console.log(err);
  }
};

const run = async () => {
  try {
    const token = await getGithubToken();

    github.githubAuth(token);

    const url = await repo.createRemoteRepo();

    await repo.createGitignore();

    const done = await repo.setupRepo(url);
    if (done) {
      console.log(chalk.green('All done!'));
    }
  } catch (err) {
    if (err) {
      switch (err.code) {
        case 401:
          console.log(
            chalk.red(
              "Couldn't log you in. Please provide the correct credentials/token."
            )
          );
          break;
        case 422:
          console.log(
            chalk.red('There already exists a remote repo with the same name')
          );
          break;
        default:
          console.log(err);
      }
    }
  }
};

run();
