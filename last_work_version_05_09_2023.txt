//==================================NoUnHumano================================
const TelegramApi = require( 'node-telegram-bot-api' );
const token       = '5563097568:AAGFOWL5-Gy1-vYwC1xL-Oem3zIt-qcYuOk';
const bot         = new TelegramApi( token, { polling: true } );

//=================================dataCollector==============================
// const TelegramApi = require( 'node-telegram-bot-api' );
// const token = '5669495083:AAGHtG7YcmBxSsaIHuxGYbqRb4rwu2s0Dow';
// const bot = new TelegramApi( token, { polling: true } );

//=======================================global-variables=====================================
const LIST_OF_CHATS            = new Map();
const URL_FOR_GREETING_STICKER = 'https://chpic.su/_data/stickers/t/the_best_simpsons/the_best_simpsons_039.webp'; //'https://chpic.su/_data/stickers/g/Gvolley/Gvolley_014.webp';
// const URL_FOR_EMPTY_LIST       = 'https://chpic.su/_data/stickers/s/SmeshnayaSemya/SmeshnayaSemya_006.webp';
const RESERVE_NAMING           = '~~~reserved~~~';
//===========================================global-variables=========================================
//begin=======================================global-objects-markups=======================================
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

const addAdditionPlayerToWaitingList = {
    reply_markup: JSON.stringify( {
        inline_keyboard: [
            [ 
                { text: 'добавить в ОЖИДАНИЕ', callback_data: 'registerAdditionalPlayerToWaitingList' },
            ],
        ]
    } )
}

const requestForIncreaseList = {
    reply_markup: JSON.stringify( {
        inline_keyboard: [
            [ 
                { text: 'подтвердить добавление мест', callback_data: 'increaseList' },
            ],
        ]
    } )
}
//end=======================================global-objects-markups=======================================

//begin=======================================supporting_functions=======================================
function InfoAboutGame( infoGame, maxPlrs, userID, userIDPlusOne ) { // constructor of object for event

    this.mapForListPlayers    = new Map();
    this.mapReservePlaces     = new Map();
    this.arrUserAdmin         = [ userID ];
    this.objOfReservedSeats   = {};
    this.objAdminExtraPlayers = {}; 
    this.gameDescription      = infoGame.trim() || 'в данный момент набор на игру не идет';
    this.maxPlayers           = Number( maxPlrs );

    this.objOfReservedSeats[ userID ]          = RESERVE_NAMING;
    this.objAdminExtraPlayers[ userID ]        = [];
    this.objAdminExtraPlayers[ userIDPlusOne ] = [];
}

const getNumberOfReservedSeats = obj => Array.from( obj.values() ).filter( item => item === RESERVE_NAMING ).length;
const getNumberOfVacancies     = ( maxPlayers, currentNumberOfPlrs ) => maxPlayers - currentNumberOfPlrs;
const getFullNameOfPlayers     = ( userName, userSurname ) => `${ userName } ${ userSurname }`;

function randomInteger( min, max ) {
    let rand = min + Math.random() * ( max + 1 - min );
    return Math.floor( rand );
}

async function restartListOfPlayers( chatId, infoAboutGame ) {

    const listPlayers  = LIST_OF_CHATS.get( chatId ).mapForListPlayers;
    const reserveSeats = LIST_OF_CHATS.get( chatId ).objOfReservedSeats;

    for ( let item of Object.entries( reserveSeats ) ) {
     
        listPlayers.set( Number( item[ 0 ] ), item[ 1 ] );
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

// /FRIDAY, st.Gomselmash, 19.00-20.00, 2r. * 1
const increaseNumberOfPlace = ( chatId, increaseNumber ) => {

    let currentCountOfList = Number.parseInt( LIST_OF_CHATS.get( chatId )?.maxPlayers ) || 0;
    let finalCountOfList   = currentCountOfList + increaseNumber;

    if ( LIST_OF_CHATS.get( chatId )?.maxPlayers ) {
        
        LIST_OF_CHATS.get( chatId ).maxPlayers = finalCountOfList;

    } else { return; }
}

// const dicreaseNumberOfPlace = ( chatId ) => LIST_OF_CHATS.get( chatId )?.maxPlayers - 1;
//end==========================================supporting_functions=======================================

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
            arrUserAdmin,
            objAdminExtraPlayers,
            gameDescription,
            maxPlayers,
        } = LIST_OF_CHATS.get( chatId ) || new InfoAboutGame( '', 0 );

        // /FRIDAY, st.Gomselmash, 19.00-20.00, 2r. * 1
        if ( text.split( '*' ).length === 2 || text.split( '*' ).length === 3 ) {
 
            let [ infoGame, maxPlrs ] = text.slice( 1 ).split( '*' );
            
            LIST_OF_CHATS.set( chatId, new InfoAboutGame( infoGame, maxPlrs, userID, userIDPlusOne ) );

            restartListOfPlayers( chatId, infoGame );
        }

        if ( arrUserAdmin.includes( userID ) ) {

            if ( text.includes( '/+' ) && Number.isInteger( Number.parseInt( text.slice( 2 ) ) ) ) {

                return bot.sendMessage( chatId, 'увеличить ОСНОВНОЙ список на ' + Number.parseInt( text.slice( 2 ) ) + '?', requestForIncreaseList );
            }
 
            // if ( text === '/-1' ) {

            //     return bot.sendMessage( chatId, `число мест изменено ( ${ dicreaseNumberOfPlace( chatId ) } )` );
            // }
        }

        if ( text === '+' ) {

            if ( mapReservePlaces.has( userID ) ) return bot.sendMessage( chatId, `"${ fullName }" в списке ОЖИДАНИЯ` );

            if ( mapForListPlayers.has( userID ) ) {

                if ( mapForListPlayers.get( userID ) === RESERVE_NAMING ) {
                    
                    mapForListPlayers.set( userID, fullName );
                    return bot.sendMessage( chatId, `"${ fullName.trim() }" резерв подтвержден, \n${ getMessAboutVacanciesAndReserve( LIST_OF_CHATS.get( chatId ) ) }` );
                }

                return bot.sendMessage( chatId, `"${ fullName }" в ОСНОВНОМ списке` );
            }

            if ( mapForListPlayers.size === maxPlayers ) {

                return bot.sendMessage( chatId, `мест нет, добавить в ОЖИДАНИЕ?`, addToReserveMapOptions ); 
            }
            
            mapForListPlayers.set( userID, fullName );
            bot.sendMessage( 992246936, `userId - ${ userID }; fullName - ${ fullName }` );
            return bot.sendMessage( chatId, `"${ fullName.trim() }" добавлен(а) в ОСНОВНОЙ список, \n${ getMessAboutVacanciesAndReserve( LIST_OF_CHATS.get( chatId ) ) }` );
        }

        // /FRIDAY, st.Gomselmash, 19.00-20.00, 2r. * 2

        if ( text === '-' ) {

            if ( mapForListPlayers.has( userID ) && mapForListPlayers.get( userID ) === RESERVE_NAMING ) {

                mapForListPlayers.delete( userID );
                await bot.sendMessage( chatId, `"${ fullName }" резерв удален, \n${ getMessAboutVacanciesAndReserve( LIST_OF_CHATS.get( chatId ) ) }` );
            }

            if ( mapForListPlayers.has( userID ) ) {

                mapForListPlayers.delete( userID );
                await bot.sendMessage( chatId, `"${ fullName }" удален(а) из ОСНОВНОГО списка, \n${ getMessAboutVacanciesAndReserve( LIST_OF_CHATS.get( chatId ) ) }` );
            }

            if ( mapReservePlaces.has( userID ) ) {

                mapReservePlaces.delete( userID );
                return bot.sendMessage( chatId, `"${ fullName }" удален(а) из ОЖИДАНИЯ` );
            }
        }

        if ( text === 'список' ) {

            let str    = '\n[ОСНОВНОЙ список]\n';
            let number = 1;

            if ( maxPlayers === 0 ) {

                return bot.sendMessage( chatId, 'набор на игру закрыт' );
            }

            mapForListPlayers.forEach( item => str += `${ number++ }. ${ item } \n` );

            for ( number; number <= maxPlayers; number++ ) { 
                str += `${ number }. \n`; 
            }

            if ( mapReservePlaces.size ) {

                let numberOfListWaiting = 1;
                str += `\n[ОЖИДАНИЕ]\n`;
                mapReservePlaces.forEach( item => str += `${ numberOfListWaiting++ }. ${ item } \n` );
            }

            return bot.sendMessage( chatId, str );
        }

        if ( text === 'инфа' ) {

            // console.log( LIST_OF_CHATS );

            return bot.sendMessage( chatId, `${ gameDescription }, \nколичество мест - ${ maxPlayers }` );
        }

        // /FRIDAY, st.Gomselmash, 19.00-20.00, 2r. * 1
        if ( text === '+1' ) {

            if ( maxPlayers === 0 ) {

                return bot.sendMessage( chatId, 'набор на игру закрыт' );
            }

            //=====condition if the list hasn't free seat/s
            if ( mapForListPlayers.size >= maxPlayers ) { 

                if ( mapReservePlaces.has( userIDPlusOne ) || mapForListPlayers.has( userIDPlusOne ) ) {

                    return bot.sendMessage( chatId, `${ userName } может добавить только ОДНОГО "+1"` );

                } else {

                    return bot.sendMessage( chatId, `добавить "${ userName } + 1" в ОЖИДАНИЕ?`, addAdditionPlayerToWaitingList ); 
                }
            }
            //=======================condition if the list has free seat/s==========================

            //begin=====================for_admin========================
            if ( arrUserAdmin.includes( userID ) ) {

                const id = userID + randomInteger( 1, 1000 );

                if ( !objAdminExtraPlayers[ userID ].includes( id ) ) {  // in order to avoid the same id

                    objAdminExtraPlayers[ userID ].push( id );
                    mapForListPlayers.set( id, `${ fullName } + 1` ); 
                }
                
                return bot.sendMessage( chatId, `"${ fullName } +1" добавлен(а) в ОСНОВНОЙ список; \n${ getMessAboutVacanciesAndReserve( LIST_OF_CHATS.get( chatId ) ) }` );
            } 
            //end=======================for_admin========================
            
            if ( mapForListPlayers.has( userIDPlusOne ) ) {

                return bot.sendMessage( chatId, `${ userName } может добавить только ОДНОГО "+1"` );

            } else {
                //=================================for regular users=================================
                mapForListPlayers.set( userIDPlusOne, `${ fullName } + 1` );
                return bot.sendMessage( chatId, `"${ fullName } + 1" добавлен(а) в ОСНОВНОЙ список; \n${ getMessAboutVacanciesAndReserve( LIST_OF_CHATS.get( chatId ) ) }` );
            }
        }

        // /FRIDAY, st.Gomselmash, 19.00-20.00, 2r. * 1
        if ( text === '-1' ) {

            //begin=====================for_admin========================
            if ( arrUserAdmin.includes( userID ) ) {

                if ( objAdminExtraPlayers[ userIDPlusOne ].length ) {

                    mapReservePlaces.delete( objAdminExtraPlayers[ userIDPlusOne ].pop() );
                    return bot.sendMessage( chatId, `"${ fullName } + 1" удален(а) из ОЖИДАНИЯ` );
                }

                if ( objAdminExtraPlayers[ userID ].length ) {

                    mapForListPlayers.delete( objAdminExtraPlayers[ userID ].pop() );
                    await bot.sendMessage( chatId, `"${ fullName } + 1" удален(а) из ОСНОВНОГО списка, \n${ getMessAboutVacanciesAndReserve( LIST_OF_CHATS.get( chatId ) ) }` );
                }
            }
            //end=======================for_admin========================

            //begin===========================for_regular_users=================================
            if ( mapForListPlayers.has( userIDPlusOne ) ) {

                mapForListPlayers.delete( userIDPlusOne );
                await bot.sendMessage( chatId, `"${ fullName } + 1" удален(а) из ОСНОВНОГО списка, \n${ getMessAboutVacanciesAndReserve( LIST_OF_CHATS.get( chatId ) ) }` );            
            }

            if ( mapReservePlaces.has( userIDPlusOne ) ) {

                mapReservePlaces.delete( userIDPlusOne );
                return bot.sendMessage( chatId, `"${ fullName } + 1" удален(а) из ОЖИДАНИЯ` );
            }
            //end==============================for_regular_users=================================
        }

        // /FRIDAY, st.Gomselmash, 19.00-20.00, 2r. * 1
        if ( getNumberOfVacancies( maxPlayers, mapForListPlayers.size ) && mapReservePlaces.size ) {

            const arrReservePlace = Array.from( mapReservePlaces.entries() ) || [];

            let idAdmin, idAdminPlusOne = arrUserAdmin[ 0 ];

            idAdmin        = arrUserAdmin[ 0 ];
            idAdminPlusOne = idAdmin * 2;

            mapForListPlayers.set( arrReservePlace[ 0 ][ 0 ], arrReservePlace[ 0 ][ 1 ] );

            if ( objAdminExtraPlayers[ idAdminPlusOne ].includes( arrReservePlace[ 0 ][ 0 ] ) ) { //====================for_admin=====================

                objAdminExtraPlayers[ idAdmin ].push( objAdminExtraPlayers[ idAdminPlusOne ][ 0 ] );
                objAdminExtraPlayers[ idAdminPlusOne ].shift();
            }

            mapReservePlaces.delete( arrReservePlace[ 0 ][ 0 ] );

            return bot.sendMessage( chatId, `"${ arrReservePlace[ 0 ][ 1 ] }" добавлен(а) в ОСНОВНОЙ список` );
        }
    } );

    bot.on( 'callback_query', async msg => {

        const data          = msg.data;
        const chatId        = msg.message.chat.id;
        const userID        = msg.from.id;
        const userIDPlusOne = userID + userID;
        const userName      = msg.from.first_name;
        const userSurname   = msg.from.last_name || '';
        const fullName      = getFullNameOfPlayers( userName, userSurname );

        const { 

            mapForListPlayers,
            mapReservePlaces,
            arrUserAdmin,
            objAdminExtraPlayers, 

        } = LIST_OF_CHATS.get( chatId ) || new InfoAboutGame( '', 0 );

        if ( data === 'registerPlayer' ) {

            if ( mapForListPlayers.has( userID ) ) {

                return bot.sendMessage( chatId, `${ fullName } уже записан` );

            } else if ( mapReservePlaces.has( userID ) ) { 

                return bot.sendMessage( chatId, `${ fullName } уже в списке ОЖИДАНИЯ` );
            
            } else {

                mapReservePlaces.set( userID, fullName );
                return bot.sendMessage( chatId, `"${ fullName }" добавлен(а) в ОЖИДАНИЕ` );
            }
        }

        // /FRIDAY, st.Gomselmash, 19.00-20.00, 2r. * 1

        if ( data === 'increaseList' ) {

            if ( arrUserAdmin.includes( userID ) ) {

                let re  = /[0-9]/;
                let num = Number.parseInt( msg.message.text.match( re )[ 0 ] );

                increaseNumberOfPlace( chatId, num );

                await bot.sendMessage( chatId, `ОСНОВНОЙ список увеличен, мест - ${ LIST_OF_CHATS.get( chatId )?.maxPlayers }` );

                if ( mapReservePlaces.size && getNumberOfVacancies( LIST_OF_CHATS.get( chatId )?.maxPlayers, mapForListPlayers.size ) ) {
                    
                    for ( let propReservePlaces of mapReservePlaces ) {
                        
                        if ( ( LIST_OF_CHATS.get( chatId )?.mapForListPlayers?.size === LIST_OF_CHATS.get( chatId )?.maxPlayers ) || ( LIST_OF_CHATS.get( chatId )?.mapReservePlaces?.size === 0 ) ) {
                            
                            return;
                            
                        } else {
                            
                            mapForListPlayers.set( propReservePlaces[ 0 ], propReservePlaces[ 1 ] );

                            await bot.sendMessage( chatId, `"${ propReservePlaces[ 1 ] }" добавлен(а) в ОСНОВНОЙ список` );

                            for ( let propExtraPlayers in objAdminExtraPlayers ) {

                                if ( objAdminExtraPlayers[ propExtraPlayers ].includes( propReservePlaces[ 0 ] ) ) {

                                    objAdminExtraPlayers[ propExtraPlayers / 2 ].push( propReservePlaces[ 0 ] );
                                    objAdminExtraPlayers[ propExtraPlayers ].shift();
                                }
                            }
                            
                            mapReservePlaces.delete( propReservePlaces[ 0 ] );
                        }
                    }                   
                }

            } else {

                return bot.sendMessage( chatId, `"${ fullName }" не может увеличивать список` );
            }
        }

        // /FRIDAY, st.Gomselmash, 19.00-20.00, 2r. * 1
        if ( data === 'registerAdditionalPlayerToWaitingList' ) {

            //begin=====================for_admin========================
            if ( arrUserAdmin.includes( userID ) ) {

                const id = userID + randomInteger( 1, 1000 );

                if ( !objAdminExtraPlayers[ userIDPlusOne ].includes( id ) ) {  // in order to avoid the same id

                    objAdminExtraPlayers[ userIDPlusOne ].push( id );
                    mapReservePlaces.set( id, `${ fullName } + 1` );
                }

                return bot.sendMessage( chatId, `"${ userName } + 1" добавлен(а) в ОЖИДАНИЕ` );
            }
            //end=======================for_admin========================

            //begin=============================for_regular_users===================================
            if ( mapReservePlaces.has( userIDPlusOne ) ) {

                return bot.sendMessage( chatId, `"${ userName } + 1" уже в списке ОЖИДАНИЯ` );

            } else {

                mapReservePlaces.set( userIDPlusOne, `${ fullName } + 1` );
                return bot.sendMessage( chatId, `"${ userName } + 1" добавлен(а) в ОЖИДАНИЕ` );
            }
            //end===========================for_regular_users======================================
        }
    } );
}

start();

/*LIST_OF_CHATS = {

    chatId_1: obj_InfoAboutGame {
        ...
    },

    chatId_2: obj_InfoAboutGame {
        ...
    },

    ... ,

    chatId_n: obj_InfoAboutGame {
        ...
    }
}*/