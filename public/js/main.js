( function( w, d, u ){
	const socket = io(),
		img = document.querySelector( 'img' );

	img.addEventListener( 'click', e => socket.emit( 'getNew' ) );

	socket.on( 'data', data => {
		console.log( data );
	} );

	socket.on( 'newGIF', data => {
		console.log( data );
		img.src = data.url;
	} );
} )( window, document, undefined );
