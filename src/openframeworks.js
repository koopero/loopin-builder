module.exports = openframeworks

const _ = require('lodash')
    , Promise = require('bluebird')
    , fs = Promise.promisifyAll( require('fs-extra'))
    , glob = Promise.promisify( require('glob') )
    , path = require('path')
    , os = require('os')
    , Download = require('download')
    , downloadStatus = require('download-status')


function openframeworks() {
  const build = this

  if ( !build.openframeworks )
    build.openframeworks = build.resolve( build.settings.openframeworks.dir )

  return ensure()

  function ensure ( ) {
    if ( exists() && !build.clean )
      return

    return ensureZip()
      .then( unpack )
  }

  function exists() {

    // Random file in the openFrameworks directory
    const file = './CODE_OF_CONDUCT.md'

    return fs.existsSync( build.resolve( build.settings.openframeworks.dir, file ) )
  }

  function ensureZip( ) {
    const version  = build.settings['openframeworks']['version']
        , platform = require('./platform')
        , stringsub = require('string-substitute')
        , zip_name = build.substitute( build.settings['openframeworks']['zip_name'] )
        , release_url = build.substitute( build.settings['openframeworks']['release_url'] ) + zip_name
        , tmp = build.resolve( 'tmp' )

    if ( !build['openframeworksZip'] )
      build['openframeworksZip'] = build.resolve( tmp, zip_name )

    if ( fs.existsSync( build['openframeworksZip'] ) )
      return Promise.resolve( true )


    build.log('cd', tmp )
    build.log('wget', release_url )

    var download = new Download({strip: 1})
        .get( release_url, tmp )

    if ( !build.quiet )
        download = download.use(downloadStatus())

    return Promise.fromCallback( ( callback ) => download.run( callback ) )
  }

  function unpack() {
    const Decompress = require('decompress')
        , source = build['openframeworksZip']
        , dest = build['openframeworks']


    build.log('unzip', source, dest )

    var decompress = new Decompress({mode: '755'})
      .src( source )
      .dest( dest )

    switch ( os.platform() ) {
      case 'darwin':
        decompress = decompress.use(Decompress.zip({strip: 1}))
      break

      case 'linux':
        decompress = decompress.use(Decompress.targz({strip: 1}))
      break
    }

    return Promise.fromCallback( ( callback ) => decompress.run( callback ) )
  }
}
