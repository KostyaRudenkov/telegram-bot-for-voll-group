const TelegramApi = require( 'node-telegram-bot-api' );
const token = '5563097568:AAGFOWL5-Gy1-vYwC1xL-Oem3zIt-qcYuOk';
const bot = new TelegramApi( token, { polling: true } );

const chatsID = { NEYDERZIMIE: -418001771, TEST_GROUP: -682186863, };

const GROUP_CHAT_ID             = chatsID.TEST_GROUP;
const INFO_ABOUT_GAME           = 'ВТОРНИК, ст. Гомсельмаш, 19.30-21.30, 2р.';
const URL_FOR_GREETING_STICKER  = 'https://chpic.su/_data/stickers/g/Gvolley/Gvolley_014.webp';
const URL_FOR_EMPTY_LIST        = 'https://chpic.su/_data/stickers/r/RoboSanta/RoboSanta_012.webp';
const URL_LOOKING_FOR_PLAYERS   = 'https://chpic.su/_data/stickers/r/RoboSanta/RoboSanta_010.webp';
const URL_GATHERING_PEOPLE_OVER = 'https://chpic.su/_data/stickers/r/RoboSanta/RoboSanta_003.webp';
const MAX_PLAYERS               = 12;


const mapForListPlayers = new Map();
const rezervPlayers = {

    992246936: '<< резерв >>',
    1282219634: '<< резерв >>',
}

for ( let item of Object.entries( rezervPlayers ) ) {
    
    mapForListPlayers.set( Number( item[ 0 ] ), item[ 1 ] );
}

// const signUpForGamaOptions = {
//     reply_markup: JSON.stringify( {
//         inline_keyboard: [
//             [ 
//                 { text: 'я +', callback_data: 'registerPlayer' }, 
//                 { text: 'я -', callback_data: 'delPlayer' },
//             ],
//             [ 
//                 { text: 'список', callback_data: 'showListOfCompetitors' }, 
//                 { text: 'инфа', callback_data: 'infoAboutGame' }, 
//                 { text: '+1', callback_data: 'addAdditionalPlayer' }, 
//                 { text: '-1', callback_data: 'delAdditionalPlayer' },
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


//========================supporting_functions==============================
const getCurrentNumberOfPlayers = map => map.size;
const getFullNameOfPlayers      = ( userName, userSurname ) => userName + ' ' + userSurname;
//========================supporting_functions==============================

async function start() {

    bot.setMyCommands( [

        { command: '/info', description: 'Print name user' },
        { command: '/sticker', description: 'Print name user' },
    ] );
    
    // await bot.sendSticker( GROUP_CHAT_ID, URL_FOR_GREETING_STICKER );
    // await bot.sendMessage( GROUP_CHAT_ID, 'привет, кожаные мешки)) записываемся на ближайшую игру\n' );
    await bot.sendMessage( GROUP_CHAT_ID, INFO_ABOUT_GAME, signUpForGamaOptions );

    bot.on( 'message', async msg => {
    
        const text          = msg.text;
        const chatId        = msg.chat.id;
        const userID        = msg.from.id;
        const userIDPlusOne = userID + userID;
        const userName      = msg.from.first_name;
        const userSurname   = msg.from.last_name || '';
        const fullName      = getFullNameOfPlayers( userName, userSurname );

        // if ( text === '/info@NoUnHumanoBot' ) {

        //     console.log( msg );
        // }

        if ( text === '+' ) {
            
            if ( mapForListPlayers.has( userID ) ) {

                if ( mapForListPlayers.get( userID ) === '<< резерв >>' ) {
                    
                    mapForListPlayers.set( userID, fullName );

                    await bot.sendMessage( chatId, `<< ${ fullName } >> подтвердил свой резерв` );
                    return bot.sendMessage( chatId, `свободных мест - ${ MAX_PLAYERS - getCurrentNumberOfPlayers( mapForListPlayers ) }` );
                }

                return bot.sendMessage( chatId, `<< ${ fullName } >> уже есть в списке` );
            }

            if ( getCurrentNumberOfPlayers( mapForListPlayers ) === MAX_PLAYERS ) {

                return bot.sendMessage( chatId, `мест нет, сообщу, если появятся` );
            }
            
            mapForListPlayers.set( userID, fullName );
            await bot.sendMessage( chatId, `+++ ${ fullName } +++ записан(а) на игру` );

            if ( getCurrentNumberOfPlayers( mapForListPlayers ) === MAX_PLAYERS ) {

                await bot.sendSticker( chatId, URL_GATHERING_PEOPLE_OVER );
                return bot.sendMessage( chatId, `!!! набор окончен !!! сообщу, если появятся места` );
            }

            return bot.sendMessage( chatId, `осталось ${ MAX_PLAYERS - getCurrentNumberOfPlayers( mapForListPlayers ) } мест(а/о)` );
        }

        if ( text === '-' ) {

            if ( !mapForListPlayers.has( userID ) ) {

                return;
            }

            if ( getCurrentNumberOfPlayers( mapForListPlayers ) === MAX_PLAYERS ) {
                
                mapForListPlayers.delete( userID );

                await bot.sendMessage( chatId, `--- ${ fullName } --- выбыл(а) из списка` );
                await bot.sendSticker( chatId, URL_LOOKING_FOR_PLAYERS );
                return bot.sendMessage( chatId, `появилось место, налетай` );       
            }

            mapForListPlayers.delete( userID );

            await bot.sendMessage( chatId, `--- ${ fullName } --- выбыл(а) из списка` );
            return bot.sendMessage( chatId, `осталось ${ MAX_PLAYERS - getCurrentNumberOfPlayers( mapForListPlayers ) } мест(а/о)` );
        }

        if ( text === 'список' ) {

            let str    = '';
            let number = 1;

            if ( !getCurrentNumberOfPlayers( mapForListPlayers ) ) {
                
                await bot.sendSticker( chatId, URL_FOR_EMPTY_LIST );
                return bot.sendMessage( chatId, 'пока никто не записался' );
            }

            mapForListPlayers.forEach( item => str += number++ + '. ' + item + '\n' );

            return bot.sendMessage( chatId, str );
        }

        if ( text === 'инфа' ) {
            
            await bot.sendMessage( GROUP_CHAT_ID, INFO_ABOUT_GAME );
            return bot.sendMessage( chatId, `максимум ${ MAX_PLAYERS } человек` );
        }

        if ( text === '+1' ) {

            if ( mapForListPlayers.has( userIDPlusOne ) ) {

                return bot.sendMessage( chatId, `с собой можно позвать только ОДНОГО другана` );
            }

            if ( getCurrentNumberOfPlayers( mapForListPlayers ) === MAX_PLAYERS ) {

                return bot.sendMessage( chatId, `мест нет, следи за новостями` );
            }

            mapForListPlayers.set( userIDPlusOne, fullName + ' + 1' );
            await bot.sendMessage( chatId, `<<< ${ fullName } >>> записал(а) одного игрока` );

            if ( getCurrentNumberOfPlayers( mapForListPlayers ) === MAX_PLAYERS ) {

                await bot.sendSticker( chatId, URL_GATHERING_PEOPLE_OVER );
                return bot.sendMessage( chatId, `!!!набор окончен!!! сообщу, если появятся места` );
            }
        }

        if ( text === '-1' ) {

            if ( mapForListPlayers.has( userIDPlusOne ) ) {

                if ( getCurrentNumberOfPlayers( mapForListPlayers ) === MAX_PLAYERS ) {

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