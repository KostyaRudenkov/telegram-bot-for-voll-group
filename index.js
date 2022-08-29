const TelegramApi = require( 'node-telegram-bot-api' );
const token = '5563097568:AAGFOWL5-Gy1-vYwC1xL-Oem3zIt-qcYuOk';
const bot = new TelegramApi( token, { polling: true } );

const chatsID = { NEYDERZIMIE: -1001641531688, TEST_GROUP: -682186863, };

const GROUP_CHAT_ID             = chatsID.NEYDERZIMIE;
const INFO_ABOUT_GAME           = 'ВТОРНИК, ст. Гомсельмаш, 19.30-21.30, 2р.';
const URL_FOR_GREETING_STICKER  = 'https://chpic.su/_data/stickers/g/Gvolley/Gvolley_014.webp';
const URL_FOR_EMPTY_LIST        = 'https://chpic.su/_data/stickers/r/RoboSanta/RoboSanta_012.webp';
const URL_LOOKING_FOR_PLAYERS   = 'https://chpic.su/_data/stickers/r/RoboSanta/RoboSanta_010.webp';
const URL_GATHERING_PEOPLE_OVER = 'https://chpic.su/_data/stickers/r/RoboSanta/RoboSanta_003.webp';
const MAX_PLAYERS               = 12;
const RESERVE_NAMING            = '--- reserved ---';

const mapForListPlayers = new Map();
const objOfReservedSeats = {

    992246936: RESERVE_NAMING, //Kostya
    1282219634: RESERVE_NAMING, //Kolya
}

const arrUserIdWithSpecPermits = [ 992246936, 1282219634 ];

const objWithIdAdditionalPlayers = {
    992246936: [],
    1282219634: [],
};

for ( let item of Object.entries( objOfReservedSeats ) ) {
    
    mapForListPlayers.set( Number( item[ 0 ] ), item[ 1 ] );
}

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


const signUpForGamaOptions = {
    reply_markup:  {
        keyboard: [
            [ '+', '-' ],
            [ 'список', 'инфа', '+1', '-1' ],
        ],

        resize_keyboard: true,
    } 
}

//==========================================supporting_functions=======================================
const getNumberOfVacancies     = () => MAX_PLAYERS - mapForListPlayers.size;
const getFullNameOfPlayers     = ( userName, userSurname ) => userName + ' ' + userSurname;
const getNumberOfReservedSeats = obj => Array.from( obj.values() ).filter( item => item === RESERVE_NAMING ).length;

function randomInteger( min, max ) {
    let rand = min + Math.random() * ( max + 1 - min );
    return Math.floor( rand );
}
//==========================================supporting_functions=======================================

async function start() {

    // bot.setMyCommands( [

    //     { command: '/info', description: 'Print name user' },
    //     { command: '/sticker', description: 'Print name user' },
    // ] );
    
    await bot.sendSticker( GROUP_CHAT_ID, URL_FOR_GREETING_STICKER );
    await bot.sendMessage( GROUP_CHAT_ID, 'привет, кожаные мешки)) записываемся на ближайшую игру\n' );
    await bot.sendMessage( GROUP_CHAT_ID, INFO_ABOUT_GAME, signUpForGamaOptions );

    bot.on( 'message', async msg => {
    
        const text          = msg.text;
        const chatId        = msg.chat.id;
        const userID        = msg.from.id;
        const userName      = msg.from.first_name;
        const userIDPlusOne = userID + userID;
        const userSurname   = msg.from.last_name || '';
        const fullName      = getFullNameOfPlayers( userName, userSurname );

        if ( text === '/info@NoUnHumanoBot' ) { console.log( msg ); }
        
        if ( text === '+' ) {
            
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
                await bot.sendSticker( chatId, URL_LOOKING_FOR_PLAYERS );
                return bot.sendMessage( chatId, `появилось место, налетай` );       
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
                return bot.sendMessage( chatId, 'пока никто не записался' );
            }

            mapForListPlayers.forEach( item => str += `${ number++ }. ${ item } \n` );

            for ( number; number <= MAX_PLAYERS; number++ ) { str += `${ number }. \n`; }

            return bot.sendMessage( chatId, str );
        }

        if ( text === 'инфа' ) {
            
            await bot.sendMessage( GROUP_CHAT_ID, INFO_ABOUT_GAME );
            return bot.sendMessage( chatId, `максимум человек: ${ MAX_PLAYERS }` );
        }

        if ( text === '+1' ) {

            if ( mapForListPlayers.size === MAX_PLAYERS ) { return bot.sendMessage( chatId, `все занято, сообщу, если появятся места` ); }

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