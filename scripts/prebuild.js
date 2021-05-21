const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const fse = require('fs-extra');
const rimraf = require('rimraf');

function renameOutputFolder(buildFolderPath, outputFolderPath) {
    return new Promise((resolve, reject) => {
        fs.rename(buildFolderPath, outputFolderPath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve('Successfully built!');
            }
        });
    });
}
function rejectError(error, reject) {
    if (error) {
        console.error(error);
        reject(error);
        return true;
    }
    return false;
}


function execPreReactBuild(mysterioPath, rootPath) {
    return new Promise((resolve, reject) => {
        exec('cd ' + mysterioPath + ' && git ls-remote origin refs/heads/master', (error, stdout) => {
            if (rejectError(error, reject))
                return;
            var remoteHead = stdout.split('\t')[0];
            exec('git rev-parse HEAD', (error, stdout) => {
                if (rejectError(error, reject))
                    return;
                var localHead = stdout;
                exec('cd ..', (error) => {
                    if (rejectError(error, reject))
                        return;
                    if (localHead !== remoteHead) {
                        exec('git submodule foreach git pull origin master && git add', (error) => {
                            if (rejectError(error, reject))
                                return;
                            fse.copySync(path.resolve(mysterioPath, './frontend/jsconfig.json'), path.resolve(rootPath, './jsconfig.json'));
                            fse.copySync(path.resolve(mysterioPath, './frontend/src'), path.resolve(rootPath, './src'));
                            fse.copySync(path.resolve(mysterioPath, './frontend/public'), path.resolve(rootPath, './public'));
                            resolve();
                        });
                    } else {
                        resolve();
                    }
                });
            });
        });
    });
}

function execPostReactBuild(buildFolderPath, outputFolderPath) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(buildFolderPath)) {
            if (fs.existsSync(outputFolderPath)) {
                rimraf(outputFolderPath, (err) => {
                    if (rejectError(err, reject))
                        return;
                    renameOutputFolder(buildFolderPath, outputFolderPath)
                        .then(val => resolve(val))
                        .catch(e => reject(e));
                });
            } else {
                renameOutputFolder(buildFolderPath, outputFolderPath)
                    .then(val => resolve(val))
                    .catch(e => reject(e));
            }
        } else {
            reject(new Error('build folder does not exist'));
        } 
    });
}

module.exports = () => {
    const projectPath = path.resolve(process.cwd(), './node_modules/.bin/react-scripts');
    return new Promise((resolve, reject) => {
        execPreReactBuild(path.resolve(__dirname, '../Mysterio'), path.join(__dirname, '../'))
            .then(() => {
                exec(`${projectPath} build`, (error) => {
                    if (rejectError(error, reject))
                        return;
                    execPostReactBuild(path.resolve(__dirname, '../build/'), path.join(__dirname, '../www/'))
                        .then((s) => {
                            console.log(s);
                            resolve(s);
                        })
                        .catch((e) => {
                            if (rejectError(e, reject))
                                return;
                        });
                    });
            })
            .catch((error) => {
                if (rejectError(error, reject))
                    return;
            });
    });
};
