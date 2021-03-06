function init () {
    $('.tld-addon').html('.' + config.tld)

    $.ajaxSetup({ async: false })

    let isValidNetworkId
    web3.version.getNetwork((err, res) => {
        isValidNetworkId = (res === 30)
        if (!isValidNetworkId) $('#wrong-network').show()
    })

    initTxReadme(isValidNetworkId)
}

/**
 * displays alert if MetaMask is not installed - requires #metamask-alert element
 */
function hasMetaMask () {
	var result = (typeof web3 !== 'undefined')
	if (result) $('#metamask-alert').hide()
    else $('#metamask-alert').show()
    return result // TODO: use it for more validations
}

/**
 * display logic for a transaction execution
 * @param {string} loading loading element id to display
 * @param {string} button button element id to disable
 */
function executeTx (loading, button) {
	$(loading).show()
	$(button).prop('disabled', true)
}

/**
 * display logic for a transaction execution finalization - rquires template/action-result
 * @param {string} loading loading element id to hide
 * @param {string} button button element id to enable
 * @param {string} error error on MetaMask tx execution
 * @param {string} result result on eMetaMask tx execution finalization
 */
function finalizeTx (loading, button, error, result) {
	handleMetamask(error, result, '#action-alert')
	$(loading).hide()
	$(button).prop('disabled', false)
}

/**
 * display logic for MetaMask response
 * @param {string} err error on MetaMask tx execution
 * @param {string} res result on MetaMask tx execution
 * @param {string} dom element to display MetaMask alert
 */
function handleMetamask (err, res, dom) {
    if (!err){
        $(dom).html(
            '<div class="alert alert-success alert-dismissible">' +
                '<b>Success!</b>' +
                '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                '<p>Check TX status: <a target="_blank" href="' + config.explorer.url + config.explorer.tx + res + '">' + res + '</a></p>' +
            '</div>')
    }
    else if (err)
        $(dom).html(
            '<div class="alert alert-danger alert-dismissible">' +
            '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
            '<p><b>There was on error processing your action!</b></p><p class="detail">' + err + 
            '</p></div>')

    $(dom).fadeIn(1000)
}

/**
 * get namehash for a domain
 * @param {string} domain domain to get de namhash
 */
function namehash (domain) {
	let node = '0000000000000000000000000000000000000000000000000000000000000000'

    if (domain) {
		let labels = domain.split('.')
		for (let i = labels.length - 1; i >= 0; i--) {
			let labelHash = web3.sha3(labels[i]).slice(2)
			node = web3.sha3(node + labelHash, {encoding: 'hex'}).slice(2)
		}
	}
	return `0x${node}`
}

/**
 * RSKIP-0060 Checksum Address ecnoding
 * @param {string} address Address to get checksum of
 * @param {number} chainId SLIP-44 chain id
 */
function toChecksumAddress (address, chainId = null) {
    const strip_address = (address.slice(0, 2) === '0x' ? address.slice(2) : address).toLowerCase()
    const prefix = chainId != null ? (chainId.toString() + '0x') : ''
    const keccak_hash = web3.sha3(prefix + strip_address).toString('hex')
    let output = '0x'

    for (let i = 0; i < strip_address.length; i++)
        output += parseInt(keccak_hash[i], 16) >= 8 ?
            strip_address[i].toUpperCase() :
            strip_address[i]

    return output
}

/**
 * returns null if the name is valid, or an error message
 * @param {string} n name
 */
function isValidName (n) {
    if (n === "") return 'Please complete the domain name'
    if (n[0] === '.') return 'Name can\'t start with "."'
    if (n[n.length - 1] === '.') return 'Name can\'t finish with "."'
    let split = n.split('.')
    split.push('')

    let i = 0
    while (split[i].length > 0) i++
    return i === split.length - 1 ? null : 'The name must contain labels between "."'
}

/**
 * returns null if label is validm or an error message
 * @param {string} l label
 */
function isValidLabel (l) {
    if (l === "") return false
    let split = l.split('.')
    return split.length === 1 ? null : 'You should enter a single label, without "."'
}

/**
 * returns if address is valid, without checksum
 * @param {string} address address to check validity
 */
function isAddress(address) {
    return /^0x[0-9a-fA-F]{40}$/.test(address)
}

/**
 * Returns null if address is upper or lower case, or has correct checksum; or an error message
 * @param {string} address address to check with checksum
 */
function isValidAddress (address) {
    var checksummed = toChecksumAddress(address, config.chainid)
    if (!isAddress(address)) return 'Invalid address'
    if (address !== address.toUpperCase().replace('X','x') &&
        address !== address.toLowerCase() &&
        address !== checksummed) return 'If you copied the address from MetaMask convert it to lowercase.'
    return null
}

/**
 * returns if the address is not null
 * @param {string} address
 */
function notNullAddress (address) {
    return address !== '0x0000000000000000000000000000000000000000' && address !== '0x00' && address !== null
}

function shouldNotCleanResult() {
    return (event.keyCode === 13)
}

/**
 * UI response when entry on #name is an invalid label
 */
function handleLabelKeyup () {
    if (shouldNotCleanResult()) return
    $('.hide-on-name-keyup').hide()

    let error = isValidLabel($('#name').val())

    if (!error) {
        $('#name-group').removeClass('on-error')
        $('.disable-on-name-invalid').attr('disabled', false)
    } else {
        $('#name-group').addClass('on-error')
        $('.disable-on-name-invalid').attr('disabled', true)
    }

    $('#name-error').html(error)

    return !error
}

/**
 * UI response when entry on #name is an invalid domain
 */
function handleNameKeyup () {
    if (shouldNotCleanResult()) return
    $('.hide-on-name-keyup').hide()

    let error = isValidName($('#name').val())

    if (!error) {
        $('#name-group').removeClass('on-error')
        $('.disable-on-name-invalid').attr('disabled', false)
    } else {
        $('#name-group').addClass('on-error')
        $('.disable-on-name-invalid').attr('disabled', true)
    }

    $('#name-error').html(error)

    return !error
}

/**
 * UI response when entry on #address is an invalid address
 */
function handleAddressKeyup () {
    if (shouldNotCleanResult()) return
	let error = isValidAddress($('#address').val())

    if (!error) {
		$('#address-group').removeClass('on-error')
        $('#address-group').removeClass('on-error')
        $('.disable-on-addr-invalid').attr('disabled', false)
    } else {
		$('#address-group').addClass('on-error')
        $('#address-group').addClass('on-error')
        $('.disable-on-addr-invalid').attr('disabled', true)
    }

	$('#address-error').html(error)
}

/**
 * Displays the name of the url parameterk in a #name input
 * @param {function} inputHandler function to trigger after displaying name
 */
function nameUrlParameter (inputHandler) {
    let regex = new RegExp('[?&]name(=([^&#]*)|&|#|$)')
    let results = regex.exec(window.location.href)

    if (results && results[2]) {
        let parameter = decodeURIComponent(results[2].replace(/\+/g, ' '))
        $('#name').val(parameter)
        if(inputHandler) inputHandler()
    }
}

/**
 * returns the web3 instance of Registrar contract
 */
function getRegistrar () {
    var registrarAbi
	$.getJSON('/contracts/registrar.json', (data) => { registrarAbi = data })

	var registrarInstance = web3.eth.contract(registrarAbi)
	var registrar = registrarInstance.at(config.contracts.registrar)

    return registrar
}

/**
 * returns the web3 instance of RIF Token contract
 */
function getRIF () {
    var RIFAbi
	$.getJSON('/contracts/rif.json', (data) => { RIFAbi = data })

	var RIFInstance = web3.eth.contract(RIFAbi)
	var RIF = RIFInstance.at(config.contracts.rif)

    return RIF
}

/**
 * returns the web3 instance of RNS Registry contract
 */
function getRNS () {
    var RNSAbi
    $.getJSON('contracts/registry.json', (data) => { RNSAbi = data })

    var RNSInstance = web3.eth.contract(RNSAbi)
    var RNS = RNSInstance.at(config.contracts.rns)

    return RNS
}

/**
 * returns the web3 instance of a Resolver contract
 * @param {string} resolverAddress the resolver address to insance
 */
function getResolver (resolverAddress) {
    var resolverAbi
    $.getJSON('/contracts/resolver.json', (data) => { resolverAbi = data })

    var resolverInstance = web3.eth.contract(resolverAbi)
    var resolver = resolverInstance.at(resolverAddress)

    return resolver
}

/**
 * Saves in URL actual name state
 * @param {string} name to push in state
 */
function pushState (name) {
    history.pushState(name, document.title, '?name=' + name)
}

/**
 * Initialize Tx readme - requires #tx-readme element
 * @param {bool} isValidNetworkId if is valid validate balances
 */
function initTxReadme (isValidNetworkId) {
    $('#tx-readme-link').click(() => {
        if($('#tx-readme:visible').length === 0) $('#tx-readme').show()
        else $('#tx-readme').hide()
    })

    if (isValidNetworkId) {
        web3.eth.getBlock('latest', (err,res) => $('#mgp').html((res.minimumGasPrice / 10**9)))

        web3.eth.getBalance(web3.eth.accounts[0], (err, res) => {
            if (web3.fromWei(res.toNumber()) === '0') $('#no-gas').show()
        })
    }
}

/**
 * copy value when a button is clicked
 * @param {string} value text to be coppied when clicked
 * @param {string} id of the button to be clicked
 * @param {string} container of an element containing the button
 */
function handleCopy (value, id, container) {
	$(id).click(() => {
		let e = document.createElement('textarea')
		e.value = value
		let p = document.getElementById(container)
		p.appendChild(e)
		e.select()
		document.execCommand('copy')
		p.removeChild(e)
	})
}
