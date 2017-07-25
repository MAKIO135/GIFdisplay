( () => {
	const getWindowDimensions = e => {
		document.body.style.width = window.innerWidth + 'px';
		document.body.style.height = window.innerHeight + 'px';
	};
	getWindowDimensions();
	window.addEventListener( 'resize', getWindowDimensions );

	const socket = io();

	socket.on( 'data', data => {
		console.log( data );
	} );

	socket.on( 'newGIF', data => {
		console.log( data );
		document.body.style.backgroundImage = `url(${ data.url })`;
	} );

	document.body.addEventListener( 'click', e => socket.emit( 'getNew' ) );
} )();
