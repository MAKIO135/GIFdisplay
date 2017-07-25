const config = require( './config' ),
    express = require( 'express' ),
    app = express(),
    http = require( 'http' ).Server( app ),
    io = require( 'socket.io' )( http ),
    Twit = require( 'twit' ),
    Giphy = require( 'giphy' );

const env = {
    port: process.env.PORT || config.server.port,
    giphy: {
        key: process.env.giphy_key || config.giphy.key
    },
    twitter: {
		consumer_key: process.env.twitter_consumer_key || config.twitter.consumer_key,
		consumer_secret: process.env.twitter_consumer_secret || config.twitter.consumer_secret,
		access_token: process.env.twitter_access_token || config.twitter.access_token,
		access_token_secret: process.env.twitter_access_token_secret || config.twitter.access_token_secret
	}
};
console.log( env );

const giphy = Giphy( env.giphy.key ),
    tw = new Twit( env.twitter ),
    stream = tw.stream( 'user' );

let currentURL = '';

const setFirstURL = ( err, random, res ) => {
    if( err !== null ){
        console.log( "Couldn't get a start URL" );
        console.log( err );
    }
    else{
        try{
            currentURL = random.data.image_original_url;
        }
        catch( e ){}
    }
}
giphy.random( setFirstURL );

( function initServer(){
    // Create the HTTP Server
    http.listen( env.port, e => console.log( 'listening on', env.port ) );

    // Tell the app where the files are and what page to serve
    app.use( express.static( __dirname + '/public' ) );
    app.get( '/', function( req, res ){
        res.sendFile( 'index.html' );
    } );
} )();

( function initSockets(){
    io.on( 'connection', socket => {
        if( currentURL != '' ) socket.emit( 'newGIF', { url: currentURL } );

        socket.on( 'getNew', () => {
            giphy.random( handleRandom );
        } );

        socket.on( 'tweet', tweet => {
            tweetEvent( tweet );
        } );
    } );
} )();


const tweetEvent = tweet => {
    if( config.debug ) logClient( 'newTweet', tweet );

    let txt = tweet.text.split( ' ' ).filter( w => w[ 0 ] != '@' && w[ 0 ] != '#'  ).join( ' ' );
    if( config.debug ) logClient( 'parsedTxt', txt );

    let hashtags = tweet.entities.hashtags.map( h => h.text );

    if( hashtags.includes( 'random' ) ){
        giphy.random( handleRandom );
    }
    else if( hashtags.includes( 'id' ) ){
        giphy.gif( { id: txt }, handleID );
    }
    else if( hashtags.includes( 'search' ) ){
        giphy.search( { q: txt, limit: 100 }, handleSearch );
    }
    else if( hashtags.includes( 'trends' ) ){
        giphy.trending( { limit: 100 }, handleTrending );
    }
    else if( hashtags.includes( 'url' ) && tweet.user.name === 'GIFdisplay' ){
        io.emit( 'newGIF', { url: tweet.entities.urls[ 0 ].expanded_url } );
    }
}
stream.on( 'tweet', tweetEvent );


const handleRandom = ( err, data, res ) => {
    if( err !== null ) console.log( err );
    else{
        if( config.debug ) logClient( 'handleRandom', data );
        try{
            currentURL = data.data.image_original_url;
            io.emit( 'newGIF', {
                url: data.data.image_original_url
            } );
        }
        catch( e ){}
    }
}

const handleID = ( err, data, res ) => {
    if( err !== null ) console.log( err );
    else{
        if( config.debug ) logClient( 'handleID', data );
        try{
            currentURL = data.data.images.original.url;
            io.emit( 'newGIF', {
                url: data.data.images.original.url
            } );
        }
        catch( e ){}
    }
}

const handleTrending = ( err, data, res ) => {
    if( err !== null ) console.log( err );
    else{
        if( config.debug ) logClient( 'handleTrending', data );
        try{
            let n = Math.random() * data.data.length | 0;
            currentURL = data.data[ n ].images.original.url;
            io.emit( 'newGIF', {
                url: data.data[ n ].images.original.url
            } );
        }
        catch( e ){}
    }
}

const handleSearch = ( err, data, res ) => {
    if( err !== null ) console.log( err );
    else{
        if( config.debug ) logClient( 'handleSearch', data );
        try{
            let n = Math.random() * data.data.length | 0;
            currentURL = data.data[ n ].images.original.url;
            io.emit( 'newGIF', {
                url: data.data[ n ].images.original.url
            } );
        }
        catch( e ){}
    }
}


// log client side
const logClient = ( event, data ) => {
    io.emit( 'data', event );
    io.emit( 'data', data );
};
