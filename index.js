//==================================NoUnHumano================================
const TelegramApi = require( 'node-telegram-bot-api' );
const token = '5563097568:AAGFOWL5-Gy1-vYwC1xL-Oem3zIt-qcYuOk';
const bot = new TelegramApi( token, { polling: true } );

//=================================dataCollector==============================
// const TelegramApi = require( 'node-telegram-bot-api' );
// const token = '5669495083:AAGHtG7YcmBxSsaIHuxGYbqRb4rwu2s0Dow';
// const bot = new TelegramApi( token, { polling: true } );
//=================================dataCollector==============================

//=======================================global-variables=====================================
const URL_FOR_GREETING_STICKER  = 'https://chpic.su/_data/stickers/t/the_best_simpsons/the_best_simpsons_039.webp'; //'https://chpic.su/_data/stickers/g/Gvolley/Gvolley_014.webp';
const URL_FOR_EMPTY_LIST        = 'https://chpic.su/_data/stickers/s/SmeshnayaSemya/SmeshnayaSemya_006.webp';
const RESERVE_NAMING            = '--- reserved ---';
const arrUserIdWithSpecPermits  = [ 992246936, 1282219634 ];
//=======================================global-variables=====================================
//=======================================global-objects=======================================
const LIST_OF_CHATS = new Map();

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
            [ `+`, '-' ],
            [ 'список', 'инфа', '+1', '-1' ],
        ],

        resize_keyboard: true,
    } 
}

const addToReserveMapOptions = {
    reply_markup: JSON.stringify( {
        inline_keyboard: [
            [ 
                { text: 'записать меня, если появятся места', callback_data: 'registerPlayer' },
            ],
        ]
    } )
}
//=======================================global-objects====================================

//==========================================supporting_functions=======================================
function InfoAboutGame( infoGame, maxPlrs ) {
    this.mapForListPlayers = new Map();
    this.mapReservePlaces  = new Map();
    this.gameDescription   = infoGame.trim() || 'в данный момент набор на игру не идет';
    this.maxPlayers        = Number( maxPlrs );
}

const getNumberOfVacancies     = ( maxPlayers, currentNumberOfPlrs ) => maxPlayers - currentNumberOfPlrs;
const getFullNameOfPlayers     = ( userName, userSurname ) => userName + ' ' + userSurname;
const getNumberOfReservedSeats = obj => Array.from( obj.values() ).filter( item => item === RESERVE_NAMING ).length;

function randomInteger( min, max ) {
    let rand = min + Math.random() * ( max + 1 - min );
    return Math.floor( rand );
}

async function restartListOfPlayers( chatId, infoAboutGame, reserve = false ) {
    const listPlayers = LIST_OF_CHATS.get( chatId ).mapForListPlayers;
    if ( reserve ) {
        for ( let item of Object.entries( objOfReservedSeats ) ) {
            listPlayers.set( Number( item[ 0 ] ), item[ 1 ] );
        }
    }
    await bot.sendSticker( chatId, URL_FOR_GREETING_STICKER );
    await bot.sendMessage( chatId, infoAboutGame, signUpForGamaOptions );
}

const getMessAboutVacanciesAndReserve = ( objectInfoGame ) => {
    const { mapForListPlayers, maxPlayers } = objectInfoGame;
    const vacansies = getNumberOfVacancies( maxPlayers, mapForListPlayers.size );
    const reserve   = getNumberOfReservedSeats( mapForListPlayers );
    return `свободных мест: ${ vacansies }, резерв: ${ reserve }`;
}

const increaseNumberOfPlace = ( chatId ) => ++LIST_OF_CHATS.get( chatId ).maxPlayers;
const dicreaseNumberOfPlace = ( chatId ) => --LIST_OF_CHATS.get( chatId ).maxPlayers;
//==========================================supporting_functions=======================================

async function start() {
    
    bot.on( 'message', async msg => {

        const chatId        = msg.chat.id;
        const text          = msg.text || '';
        const userID        = msg.from.id;
        const userName      = msg.from.first_name;
        const userIDPlusOne = userID + userID;
        const userSurname   = msg.from.last_name || '';
        const fullName      = getFullNameOfPlayers( userName, userSurname );
        
        let { 
            mapForListPlayers,
            mapReservePlaces,
            gameDescription,
            maxPlayers,
        } = LIST_OF_CHATS.get( chatId ) || new InfoAboutGame( '', 0 );
        
        if ( arrUserIdWithSpecPermits.includes( userID ) ) {
            
            //   /СРЕДА, СШ60, 19.30-21.45, 3р. * 12 * 1
            //   /СУББОТА, СШ60, 19.30-21.45, 2р. * 5 * 1

            if ( text.split( '*' ).length === 2 || text.split( '*' ).length === 3 ) {
                
                let [ infoGame, maxPlrs, reserve ] = text.slice( 1 ).split( '*' );
                
                LIST_OF_CHATS.set( chatId, new InfoAboutGame( infoGame, maxPlrs ) );
                restartListOfPlayers( chatId, infoGame, reserve );
            }

            if ( text === '/+1' ) {

                await bot.sendMessage( chatId, `число мест изменено ( ${ increaseNumberOfPlace( chatId ) } )` );
            }

            if ( text === '/-1' ) {

                return bot.sendMessage( chatId, `число мест изменено ( ${ dicreaseNumberOfPlace( chatId ) } )` );
            }
        }

        if ( text === '+' ) {

            bot.sendMessage( 992246936, `userId - ${ userID }; fullName - ${ fullName }` );

            if ( maxPlayers === 0 ) {

                await bot.sendSticker( chatId, URL_FOR_EMPTY_LIST );
                return bot.sendMessage( chatId, 'набор на игру закрыт' );
            }
            
            if ( mapForListPlayers.has( userID ) ) {

                if ( mapForListPlayers.get( userID ) === RESERVE_NAMING ) {
                    
                    mapForListPlayers.set( userID, fullName );
                    return bot.sendMessage( chatId, `"${ fullName.trim() }" резерв снят, \n${ getMessAboutVacanciesAndReserve( LIST_OF_CHATS.get( chatId ) ) }` );
                }

                return bot.sendMessage( chatId, `"${ fullName }" уже есть в списке` );
            }

            if ( mapForListPlayers.size === maxPlayers ) {

                return bot.sendMessage( chatId, `мест нет, могу записать, если появится`, addToReserveMapOptions ); 
            }
            
            mapForListPlayers.set( userID, fullName );
            return bot.sendMessage( chatId, `"${ fullName.trim() }" добавлен(а), \n${ getMessAboutVacanciesAndReserve( LIST_OF_CHATS.get( chatId ) ) }` );
        }

        if ( text === '-' ) {

            if ( !mapForListPlayers.has( userID ) ) { return; }

            if ( mapForListPlayers.has( userID ) && mapForListPlayers.get( userID ) === RESERVE_NAMING ) {

                mapForListPlayers.delete( userID );
                await bot.sendMessage( chatId, `"${ fullName }" резерв снят, \n${ getMessAboutVacanciesAndReserve( LIST_OF_CHATS.get( chatId ) ) }` );
            }

            if ( mapForListPlayers.has( userID ) ) {

                mapForListPlayers.delete( userID );
                await bot.sendMessage( chatId, `"${ fullName }" удален(а), \n${ getMessAboutVacanciesAndReserve( LIST_OF_CHATS.get( chatId ) ) }` );
            }
        }

        if ( text === 'список' ) {

            let str    = '\n====основной список====\n';
            let number = 1;

            if ( maxPlayers === 0 ) {

                return bot.sendMessage( chatId, 'набор на игру закрыт' );
            }

            if ( !mapForListPlayers.size ) {
                
                return bot.sendMessage( chatId, 'список пуст' );
            }

            mapForListPlayers.forEach( item => str += `${ number++ }. ${ item } \n` );

            for ( number; number <= maxPlayers; number++ ) { 
                str += `${ number }. \n`; 
            }

            if ( mapReservePlaces.size ) {

                let numberOfListWaiting = 1;
                str += `\n=====лист ожидания=====\n`;
                mapReservePlaces.forEach( item => str += `${ numberOfListWaiting++ }. ${ item } \n` );
            }

            return bot.sendMessage( chatId, str );
        }

        if ( text === 'инфа' ) {

            console.log( LIST_OF_CHATS );
            return bot.sendMessage( chatId, `${ gameDescription }, \nколичество мест - ${ maxPlayers }` );
        }

        if ( text === '+1' ) {

            if ( maxPlayers === 0 ) {

                return bot.sendMessage( chatId, 'набор на игру закрыт' );
            }

            if ( mapForListPlayers.size === maxPlayers ) { 
                
                return bot.sendMessage( chatId, `мест нет` ); 
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

            return bot.sendMessage( chatId, `"${ fullName }", еще +1, \n${ getMessAboutVacanciesAndReserve( LIST_OF_CHATS.get( chatId ) ) }` );
        }

        if ( text === '-1' ) {

            if ( arrUserIdWithSpecPermits.includes( userID ) && objWithIdAdditionalPlayers[ userID ].length ) {

                mapForListPlayers.delete( objWithIdAdditionalPlayers[ userID ].pop() );
                await bot.sendMessage( chatId, `"${ fullName }": -1, \n${ getMessAboutVacanciesAndReserve( LIST_OF_CHATS.get( chatId ) ) }` );
            }

            if ( mapForListPlayers.has( userIDPlusOne ) ) {

                mapForListPlayers.delete( userID + userID );
                return bot.sendMessage( chatId, `"${ fullName }": -1, \n${ getMessAboutVacanciesAndReserve( LIST_OF_CHATS.get( chatId ) ) }` );            
            } 
        }

        if ( LIST_OF_CHATS.get( chatId ).mapForListPlayers.size !== LIST_OF_CHATS.get( chatId ).maxPlayers && mapReservePlaces.size ) {

            const arrReservePlace = Array.from( mapReservePlaces.entries() );
                
            for ( let i = 0; i <= getNumberOfVacancies( maxPlayers, mapForListPlayers.size ); i++ ) {

                mapForListPlayers.set( arrReservePlace[ i ][ 0 ], arrReservePlace[ i ][ 1 ] );
                mapReservePlaces.delete( arrReservePlace[ i ][ 0 ] );

                return bot.sendMessage( chatId, `"${ arrReservePlace[ i ][ 1 ] }" добавлен(а) в основной список` );
            }
        }
    } );

    bot.on( 'callback_query', async msg => {

        const data        = msg.data;
        const chatId      = msg.message.chat.id;
        const userID      = msg.from.id;
        const userName    = msg.from.first_name;
        const userSurname = msg.from.last_name || '';
        const fullName    = getFullNameOfPlayers( userName, userSurname );
        
        const { mapForListPlayers, mapReservePlaces } = LIST_OF_CHATS.get( chatId ) || new InfoAboutGame( '', 0 );

        // /СРЕДА, СШ60, 19.30-21.45, 3р. * 2

        if ( data === 'registerPlayer' ) {

            if ( mapForListPlayers.has( userID ) ) {

                return bot.sendMessage( chatId, `${ fullName } уже записан` );

            } else if ( mapReservePlaces.has( userID ) ) { 

                return bot.sendMessage( chatId, `${ fullName } уже в списке ожидания` );
            
            } else {

                mapReservePlaces.set( userID, fullName );
                return bot.sendMessage( chatId, `"${ fullName }" добавлен(а) в лист ожидания` );
            }
        }
    } );
}

start();

/*
LIST_OF_CHATS = {

    chatId_1: Array_for_objs_InfoAboutGame [


    ],

    chatId_2: Array_for_objs_InfoAboutGame [

                
    ],

    ... ,

    chatId_n: Array_for_objs_InfoAboutGame [

                
    ]
}
*/

// bot.setMyCommands( [

//     { command: '/start', description: 'start bot' },
//     { command: '/gde_i_kogda', description: 'где и по каким дням играем' },
// ] );