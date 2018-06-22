const fs = require('fs');
const _ = require('lodash');
const git = require('simple-git')();
const CLI = require('clui');
const touch = require('touch');
const Spinner = CLI.Spinner;

const inquirer = require('./inquirer.js');
const gh = require('./github.js');

module.exports = {
  createRemoteRepo: async () => {
    const github = gh.getInstance();
    const answers = await inquirer.askRepoDetails();

    const data = {
      name: answers.name,
      description: answers.description,
      private: answers.visibility === 'private'
    };

    const status = new Spinner('Creating remote repo...');
    status.start();

    try {
      const response = await github.repos.create(data);
      return response.data.ssh_url;
    } catch (err) {
      throw err;
    } finally {
      status.stop();
    }
  },
  createGitignore: async () => {
    const filelist = _.without(fs.readdirSync('.'), '.git', '.gitignore');

    if (filelist.length) {
      const answers = await inquirer.askIngoreFiles(filelist);
      if (answers.ignore.length) {
        fs.writeFileSync('.gitignore', answers.ignore.join('\n'));
      } else {
        touch('.gitignore');
      }
    } else {
      touch('.gitignore');
    }
  },
  setupRepo: async url => {
    const status = new Spinner(
      'Initializing local repo and pushing to remote...'
    );
    status.start();

    try {
      await git
        .init()
        .add('.gitignore')
        .add('./*')
        .commit('Initial commit')
        .addRemote('origin', url)
        .push('origin', 'master');
      return true;
    } catch (err) {
      throw err;
    } finally {
      status.stop();
    }
  }
};
