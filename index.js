//@ts-check
// Nexus Mods domain for the game.
const GAME_ID = 'callofcthulhudarkcornersoftheearth';

const INSTALLER_ID = GAME_ID + '-mod';
const TEST_ID = GAME_ID + '-test-dcotehook';

// retail paths
const INSTALL_LOCATIONS = ['C:\\Program Files (x86)\\Bethesda Softworks\\Call Of Cthulhu DCoTE',
                           'C:\\Program Files\\Bethesda Softworks\\Call Of Cthulhu DCoTE',
                           'aS:\\Games\\Call Of Cthulhu DCoTE'];

const DCOTEHOOK_PATH = 'https://www.nexusmods.com/callofcthulhudarkcornersoftheearth/mods/3';
const DCOTEHOOK_MODPAGE = 'https://www.nexusmods.com/callofcthulhudarkcornersoftheearth/mods/3';

//Steam Application ID, you can get this from https://steamdb.info/apps/
const STEAMAPP_ID = '22340';

//GOG Application ID, you can get this from https://www.gogdb.org/
const GOGAPP_ID = '1189711155';

const MOD_FILE_NAF = '.naf';
const MOD_FILE_XBD = '.xbd';
const MOD_FILE_BMP = '.bmp';
const MOD_FILE_TGA = '.tga';
const MOD_FILE_DDS = '.dds';
const MOD_FILE_EXE = '.exe';
const MOD_FILE_DLL = '.dll';
const MOD_FILE_VSO = '.vso';
const MOD_FILE_PSO = '.pso';

//Import some assets from Vortex we'll need.
const path = require('path');
const { fs, log, selectors, util  } = require('vortex-api');

function main(context) {
  //log('debug', 'main')
	//This is the main function Vortex will run when detecting the game extension. 
  context.registerGame({
    id: GAME_ID,
    name: 'Call of Cthulhu: Dark Corners of the Earth',
    mergeMods: true,
    queryPath: () => findGame(),
    supportedTools: [],
    queryModPath: () => 'mods',
    logo: 'assets/cocdcote_logo.jpg',
    executable: () => 'mods/Engine/DCoTEHook.exe',
    requiredFiles: [
      'Engine/CoCMainWin32.exe',
      'Scripts/01_house.bat',
      'Resources/Xbox/01_HOUSE.pc.xbd',
      'Resources/Xbox/01_HOUSE.xbd'
    ],
    ///setup: (discovery) => prepareForModding(discovery, context.api),
    setup: (discovery) => prepareForModding(discovery),
    environment: {
      SteamAPPId: STEAMAPP_ID,
    },
    details: {
      steamAppId: STEAMAPP_ID,
      gogAppId: GOGAPP_ID
    }
  });

  context.registerTest(TEST_ID, 'gamemode-activated', checkDCoTEHook(context.api));
  context.registerInstaller(INSTALLER_ID, 25, (files, gameId) => testSupportedContent(files, gameId), (files) => installContent(files));

	return true;
}

function checkDCoTEHook(api) {
  return async () => {
    const state = api.store.getState();
    const discovery = selectors.discoveryByGame(state, GAME_ID);
    if ((discovery === undefined) || (discovery.path === undefined)) {
        return Promise.resolve(undefined);
    }

    const dcoteHookPath = path.join(discovery.path, "mods", "Engine", "DCoTEHook.dll");

    try {
      const stat = await fs.statAsync(dcoteHookPath)
    } catch(err) {
      log('debug','Hook not found!');
      const result = {
        description: {
            short: 'DCoTEHook is not installed!',
            long: 'DCoTEHook is required for any mods to work with Call of Cthulhu: Dark Corners of the Earth.'
        },
        severity: 'warning'
      };
      return Promise.resolve(result);
    }

    return Promise.resolve(undefined);
  };
}

async function findGame() {
  try {
    // check for retail paths
    for (const installLocation of INSTALL_LOCATIONS) {
      log('debug', `Looking for game in ${installLocation}`);
      try {
        if (await fs.isDirectoryAsync(installLocation)) {
          log('debug', `Found game in ${installLocation}`);
          return Promise.resolve(installLocation);
        }
      } catch (err) {
        //log('debug', `  not found [${err}]`);
      }
    }

    log('debug', 'Looking for game in Steam and GOG...');
    const game = await util.GameStoreHelper.findByAppId([STEAMAPP_ID, GOGAPP_ID]);    
    
    log('debug', `Found game in ${game.gamePath}`);

    return Promise.resolve(game.gamePath);
  } catch (err) {
    log('debug', 'Game not found!');
    return Promise.reject('Game not found!');
  }
}


function simplePrepareForModding(discovery) {
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'mods'));
    //.then(() => checkForQMM(api, qModPath));
}

function testSupportedContent(files, gameId) {
  // Make sure we're able to support this mod.
  let supported = (gameId === GAME_ID);

  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function installContent(files) {
  const modFiles = files.filter(file => path.extname(file).toLowerCase() === MOD_FILE_NAF
                                        || path.extname(file).toLowerCase() === MOD_FILE_XBD
                                        || path.extname(file).toLowerCase() === MOD_FILE_BMP
                                        || path.extname(file).toLowerCase() === MOD_FILE_EXE
                                        || path.extname(file).toLowerCase() === MOD_FILE_DLL
                                        || path.extname(file).toLowerCase() === MOD_FILE_VSO
                                        || path.extname(file).toLowerCase() === MOD_FILE_PSO
                                        || path.extname(file).toLowerCase() === MOD_FILE_TGA
                                        || path.extname(file).toLowerCase() === MOD_FILE_DDS);

  // generate the install instructions
  const instructions = modFiles.map(file => {
    return {
      type: 'copy',
      source: file,
      destination: file
    };
  });

  return Promise.resolve({ instructions });
}

async function prepareForModding(discovery) {
  log('debug', 'prepareForModding!');
  const modPath = path.join(discovery.path, 'mods')

  await fs.ensureDirWritableAsync(modPath);
  await fs.ensureDirWritableAsync(path.join(modPath, 'Engine'));
}

/*
function checkForDCoTEHook(api, dcoteHookPath) {
  return fs.statAsync(dcoteHookPath)
    .catch(() => {
      api.sendNotification({
        id: 'dcotehook-missing',
        type: 'warning',
        title: 'DCoTEHook is not installed!',
        message: 'DCoTEHook is required for any mods to work with Call of Cthulhu: Dark Corners of the Earth.',
        actions: [
          {
            title: 'Get DCoTEHook',
            action: () => util.opn(DCOTEHOOK_MODPAGE).catch(() => undefined)
          }
        ]
      });
    });
}
*/
module.exports = {
  default: main
};