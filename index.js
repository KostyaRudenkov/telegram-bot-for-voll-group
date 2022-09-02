const TelegramApi = require( 'node-telegram-bot-api' );
const token = '5563097568:AAGFOWL5-Gy1-vYwC1xL-Oem3zIt-qcYuOk';
const bot = new TelegramApi( token, { polling: true } );


//=======================================global-variables=====================================
// const chatsID                   = { NEYDERZIMIE: -1001641531688, TEST_GROUP: -1001793375329, };
// const GROUP_CHAT_ID             = chatsID.TEST_GROUP;
const URL_FOR_GREETING_STICKER  = 'https://chpic.su/_data/stickers/g/Gvolley/Gvolley_014.webp';
const URL_FOR_EMPTY_LIST        = 'https://chpic.su/_data/stickers/r/RoboSanta/RoboSanta_012.webp';
const URL_GATHERING_PEOPLE_OVER = 'https://chpic.su/ru/stickers/simpsonspackss/';
const RESERVE_NAMING            = '--- reserved ---';
const mapForListPlayers         = new Map();
const arrUserIdWithSpecPermits  = [ 992246936, 1282219634 ];

let INFO_ABOUT_GAME = 'в данный момент набор на игру не идет';
let MAX_PLAYERS     = 0;
let infoGameBefore  = '';
let maxPrlsBefore   = 0;
//=======================================global-variables=====================================
//=======================================global-objects=======================================
const objOfReservedSeats = {

    992246936: RESERVE_NAMING, //Kostya
    1282219634: RESERVE_NAMING, //Kolya
}

const objWithIdAdditionalPlayers = {
    992246936: [],
    1282219634: [],
};

const signUpForGamaOptions = {
    reply_markup:  {
        keyboard: [
            [ '+', '-' ],
            [ 'список', 'инфа', '+1', '-1' ],
        ],

        resize_keyboard: true,
    } 
}
//=======================================global-objects====================================

// const signUpForGamaOptions = {
//     reply_markup: JSON.stringify( {
//         inline_keyboard: [
//             [ 
//                 { text: 'я +', callback_data: 'registerPlayer' },
//             ],
//             [ 
//                 { text: 'список', callback_data: 'showListOfCompetitors' }, 
//                 { text: 'инфа', callback_data: 'infoAboutGame' }, 
//             ],
//         ]
//     } )
// }

//==========================================supporting_functions=======================================
const getNumberOfVacancies     = () => MAX_PLAYERS - mapForListPlayers.size;
const getFullNameOfPlayers     = ( userName, userSurname ) => userName + ' ' + userSurname;
const getNumberOfReservedSeats = obj => Array.from( obj.values() ).filter( item => item === RESERVE_NAMING ).length;

function randomInteger( min, max ) {
    let rand = min + Math.random() * ( max + 1 - min );
    return Math.floor( rand );
}

async function restartListOfPlayers( chatId ) {
    mapForListPlayers.clear();
    for ( let item of Object.entries( objOfReservedSeats ) ) {
        mapForListPlayers.set( Number( item[ 0 ] ), item[ 1 ] );
    }
    await bot.sendSticker( chatId, URL_FOR_GREETING_STICKER );
    await bot.sendMessage( chatId, 'привет, кожаные мешки)) записываемся на ближайшую игру\n' );
    await bot.sendMessage( chatId, INFO_ABOUT_GAME, signUpForGamaOptions );
}
//==========================================supporting_functions=======================================

async function start() {

    bot.setMyCommands( [

        { command: '/start', description: 'restart list of players' },
    ] );

    bot.on( 'message', async msg => {
    
        const text          = msg.text;
        const chatId        = msg.chat.id;
        const userID        = msg.from.id;
        const userName      = msg.from.first_name;
        const userIDPlusOne = userID + userID;
        const userSurname   = msg.from.last_name || '';
        const fullName      = getFullNameOfPlayers( userName, userSurname );


        if ( text === '/info@NoUnHumanoBot' ) { console.log( msg ); }

        
        if ( arrUserIdWithSpecPermits.includes( userID ) ) {

            //   /ВТОРНИК, ст. Гомсельмаш, 19.30-21.30, 2р. * 5
            
            if ( text.split( '*' ).length === 2 ) {
                
                let [ infoGame, maxPlrs ] = text.slice( 1 ).split( '*' );
                
                INFO_ABOUT_GAME = infoGame;
                MAX_PLAYERS     = Number( maxPlrs );
                infoGameBefore  = INFO_ABOUT_GAME;
                maxPrlsBefore   = MAX_PLAYERS;

                restartListOfPlayers( chatId );
            }

            if ( text === '/restart' ) { 
                
                restartListOfPlayers( chatId );
                MAX_PLAYERS = maxPrlsBefore;
                INFO_ABOUT_GAME = infoGameBefore;
            }

            if ( text === '/+1' ) {

                MAX_PLAYERS++;

                await bot.sendMessage( chatId, 'число мест изменено' );
                await bot.sendMessage( chatId, `свободных мест - ${ getNumberOfVacancies() }` );
            }

            if ( text === '/-1' ) {

                MAX_PLAYERS--;

                await bot.sendMessage( chatId, 'число мест изменено' );
                await bot.sendMessage( chatId, `свободных мест - ${ getNumberOfVacancies() }` );
            }

            if ( text === '/stop' ) {

                MAX_PLAYERS = 0;
                INFO_ABOUT_GAME = 'набор на игру сейчас не идет';
                mapForListPlayers.clear();

                await bot.sendMessage( chatId, 'ок, отдыхаем' );
                return bot.sendSticker( chatId, 'https://chpic.su/_data/stickers/s/SmeshnayaSemya/SmeshnayaSemya_003.webp' );
            }
        }
     
        if ( text === '+' ) {

            if ( MAX_PLAYERS === 0 ) {

                return bot.sendMessage( chatId, 'набор на игру закрыт' );
            }
            
            if ( mapForListPlayers.has( userID ) ) {

                if ( mapForListPlayers.get( userID ) === RESERVE_NAMING ) {
                    
                    mapForListPlayers.set( userID, fullName );

                    await bot.sendMessage( chatId, `<< ${ fullName } >> подтвердил свой резерв` );
                    return bot.sendMessage( chatId, `свободных мест: ${ getNumberOfVacancies() }, резерв: ${ getNumberOfReservedSeats( mapForListPlayers ) }` );
                }

                return bot.sendMessage( chatId, `<< ${ fullName } >> уже есть в списке` );
            }

            if ( mapForListPlayers.size === MAX_PLAYERS ) {

                return bot.sendMessage( chatId, `мест нет, сообщу, если появятся` ); 
            }
            
            mapForListPlayers.set( userID, fullName );

            await bot.sendMessage( chatId, `+++ ${ fullName } +++ записан(а) на игру` );

            if ( mapForListPlayers.size === MAX_PLAYERS ) {

                await bot.sendSticker( chatId, URL_GATHERING_PEOPLE_OVER );
                return bot.sendMessage( chatId, `!!! набор окончен !!! сообщу, если появятся места` );
            }

            return bot.sendMessage( chatId, `свободных мест - ${ getNumberOfVacancies() }` );
        }

        if ( text === '-' ) {

            if ( !mapForListPlayers.has( userID ) ) { return; }

            if ( mapForListPlayers.has( userID ) && mapForListPlayers.get( userID ) === RESERVE_NAMING ) {

                mapForListPlayers.delete( userID );

                await bot.sendMessage( chatId, `<< ${ fullName } >> отменил свой резерв` );
                return bot.sendMessage( chatId, `свободных мест:  ${ getNumberOfVacancies() }, резерв: ${ getNumberOfReservedSeats( mapForListPlayers ) }` );
            }

            if ( mapForListPlayers.size === MAX_PLAYERS ) {
                
                mapForListPlayers.delete( userID );

                await bot.sendMessage( chatId, `--- ${ fullName } --- выбыл(а) из списка` );
                return bot.sendMessage( chatId, `свободных мест: ${ getNumberOfVacancies() }` );       
            }

            mapForListPlayers.delete( userID );

            await bot.sendMessage( chatId, `--- ${ fullName } --- выбыл(а) из списка` );
            return bot.sendMessage( chatId, `свободных мест: ${ getNumberOfVacancies() }` );
        }

        if ( text === 'список' ) {

            let str    = '';
            let number = 1;

            if ( !mapForListPlayers.size ) {
                
                await bot.sendSticker( chatId, URL_FOR_EMPTY_LIST );
                return bot.sendMessage( chatId, 'пока никто не записался или набор еще не начался' );
            }

            mapForListPlayers.forEach( item => str += `${ number++ }. ${ item } \n` );

            for ( number; number <= MAX_PLAYERS; number++ ) { str += `${ number }. \n`; }

            return bot.sendMessage( chatId, str );
        }

        if ( text === 'инфа' ) {
            
            await bot.sendMessage( chatId, INFO_ABOUT_GAME );
            return bot.sendMessage( chatId, `количество мест - ${ MAX_PLAYERS }` );
        }

        if ( text === '+1' ) {

            if ( MAX_PLAYERS === 0 ) {

                return bot.sendMessage( chatId, 'набор на игру закрыт' );
            }

            if ( mapForListPlayers.size === MAX_PLAYERS ) { 
                
                return bot.sendMessage( chatId, `все занято, сообщу, если появятся места` ); 
            }

            if ( arrUserIdWithSpecPermits.includes( userID ) ) {

                const id = userID + randomInteger( 1, 100 );
                objWithIdAdditionalPlayers[ userID ].push( id );
                mapForListPlayers.set( id, `${ fullName } + 1` );

            } else if ( mapForListPlayers.has( userIDPlusOne ) ) {

                return bot.sendMessage( chatId, `${ userName } может добавить только ОДНОГО другана` );

            } else {

                mapForListPlayers.set( userIDPlusOne, `${ fullName } + 1` );
            } 

            await bot.sendMessage( chatId, `<<< ${ fullName } >>>, еще +1` );
            return bot.sendMessage( chatId, `свободных мест: ${ getNumberOfVacancies() }, резерв: ${ getNumberOfReservedSeats( mapForListPlayers ) }` );
        }

        if ( text === '-1' ) {

            if ( arrUserIdWithSpecPermits.includes( userID ) && objWithIdAdditionalPlayers[ userID ].length ) {

                mapForListPlayers.delete( objWithIdAdditionalPlayers[ userID ].pop() );
                return bot.sendMessage( chatId, `--- ${ fullName } --- удалил(а) своего другана` );
            }

            if ( mapForListPlayers.has( userIDPlusOne ) ) {

                if ( mapForListPlayers.size === MAX_PLAYERS ) {

                    mapForListPlayers.delete( userID + userID );

                    await bot.sendSticker( chatId, URL_LOOKING_FOR_PLAYERS );
                    await bot.sendMessage( chatId, `--- ${ fullName } --- удалил(а) своего другана` );
                    return bot.sendMessage( chatId, `появилось место, налетай` );
                }

                mapForListPlayers.delete( userID + userID );

                return bot.sendMessage( chatId, `--- ${ fullName } --- удалил(а) своего другана` );
            
            } else {
                
                return;
            }
        }
    } );

    // bot.on( 'callback_query', async msg => {
        
    //     if ( data === 'registerPlayer' ) { } 

    //     if ( data === 'showListOfCompetitors' ) { }
    // } );
}

start();