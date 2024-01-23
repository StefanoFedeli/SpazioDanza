// Create SVG for DB
var draw = SVG('svg').size(850, 850)
var struct = {}
var seatAv
var trans = []

function oscil(generator,ampiezza,passo) {
  if (passo % 2 == 0) {
    generator = generator - (ampiezza*passo)
  } else {
    generator = generator + (ampiezza*passo)
  }
  console.log(generator)
  return generator
}
// Fetch SVG
$.ajax({
  url: APIurl + '/info',
  method: 'GET',
  async: false
}).done(function (json, textStatus) {
  $('#appTitle').text(json.name)
  /* draw.svg(json.svg) */
  var row = 25
  json.category.forEach(function (element) {
    struct[element.name] = [element.descrizione, element.price]
    var index, col
    for (index = 0, col = 400; index < element.seat.length; index++, col = oscil(col,25,index)) {
      draw.circle(20).move(col, row).attr({
        fill: '#FFF',
        stroke: '#000',
        'stroke-with': 2,
        id: element.seat[index],
        class: element.name
      })
    }
    row += 25
  })
  console.log('API response: ' + textStatus)
  if (window.location.pathname === '/admin') {
    var passwd =  Cookies.get('BIuser') === undefined ? prompt('Inserisci Password') : 'barbara'
    $.ajax({
      url: APIurl + '/secreT',
      data : {passwd: passwd},
      method: 'GET'
    }).done(function (json, textStatus) {
      console.log('Secret Data Downloaded successfully')
      trans = json
      trans.forEach(function (element) {
        $('#txs').append('<li class="list-group-item">' +
          '<p>Codice: ' + element.tx_check + ' - ' + new Date(element.date).toUTCString() + '</p>' +
          (element.tx_valid !== undefined ? '<button type="button" onclick="removeTx(\'' + element.tx_check + '\')" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>' : '') +
          '<p>' + element.user.name + ' ' + element.user.surname + ': ' + element.user.allievo + '</p>' +
          '<p> Posti: ' + element.seats.toString() +
          (element.tx_valid === undefined ? '<span class="badge" style="background-color:#96E555 ">' : '<span class="badge">' ) + element.price + '€</span></p></li>'
        )
      })
    }).fail(function (json, textStatus) {
      $('body').empty()
      $('body').append('<div class="jumbotron"><h1>Accesso Negato</h1><p><a class="btn btn-primary btn-lg" href="." role="button"> Ricarica e riprova </a></p></div>')
      console.log('API response: ' + textStatus)
    })
  }
})
.fail(function (xhr, textStatus) {
  $('body').empty()
  $('body').append('<div class="jumbotron"><h1>APP non disponibile</h1><p><a class="btn btn-primary btn-lg" href="." role="button"> Ricarica </a></p></div>')
  console.log('API response: ' + textStatus)
})

// Fetch Seat Available
$.ajax({
  url: APIurl + '/seat',
  method: 'GET'
}).done(function (json, textStatus) {
  seatAv = json.available
  draw.each(function (i) {
    if (window.location.pathname === '/') {
      loadHome(this, json)
    } else {
      loadDashbord(this, json)
    }
  })
  console.log('API /seat response: ' + textStatus)
})
.fail(function (xhr, textStatus) {
  console.log('API /seat response: ' + textStatus)
})

function loadHome (element, json) {
  if(($.inArray(element.attr('id'), seatAv) > -1) && !($.inArray(element.attr('id'), json.reserved) > -1)) {
    /* if ($.inArray(this.attr('id'), json.reserved) > -1) {
      this.stroke({color: 'yellow'}
      this.attr('reserved', true)
    } */
    element.click(function () {
      draw.each(function (i) {
        this.fill({color: '#FFF'})
      })
      var type = struct[this.attr('class').trim()]
      $('#app-info').empty()
      $('#app-info').append('<span> Posto: ' + element.attr('id') + ' - Prezzo: ' + type[1].toFixed(2) + '€</span>')
      $('#app-info').append('<span class="label label-success pull-right"> Disponibile </span>')
      $('.AppDesc').remove()
      $('#app-error').css('display', 'none')
      if(typeof type[0] !== 'undefined')
        $('#app-body').prepend('<p class="AppDesc">' + type[0] + '</p>')
      if (element.attr('reserved'))
        $('#app-body').prepend('<div class="AppDesc alert alert-warning"> Attenzione! Hai selezionato un posto riservato! <br> <small>Questo può significare che potresti non trovarlo disponibile quando effettuerai il pagamento</small> </p>')
      $('#app-body > button').attr('id', element.attr('id'))
      $('#app-body > button').attr('price', type[1])
      element.fill({color: '#7E93B0'})
    })
  } else {
    element.style('fill', '#242E3B')
  }
}
function loadDashbord (element, json) {
  if(($.inArray(element.attr('id'), seatAv) > -1) && !($.inArray(element.attr('id'), json.reserved) > -1)) {
    element.style('fill', '#96E555')
  } else {
    element.click(function () {
      draw.each(function (i) {
        this.fill({color: '#FFF'})
      })
      $('#app-body').empty()
      $('#app-info').empty()
      for (var i = 0; i < trans.length; i++) {
        for (var j = 0; j < trans[i].seats.length; j++) {
          if (trans[i].seats[j] == element.attr('id')) {
            var time = new Date(trans[i].date)
            $('#app-info').append('<span> Posto: ' + trans[i].tx_check + ' - ' + time.toUTCString() + '</span>')
            if (trans[i].hasOwnProperty('tx_valid')) {
              $('#app-info').append('<span class="label label-danger pull-right"> Non Pagato  </span>')
            } else {
              $('#app-info').append('<span class="label label-success pull-right"> Pagato </span><br>')
            }
            $('#app-body').append('<div> Prenotato da: ' + trans[i].user.name + ' ' + trans[i].user.surname + '</div>')
            $('#app-body').append('<div> Allievo associato:' + trans[i].user.allievo + '</div>')
            $('#app-body').prepend('<h6> Posto N°' + element.attr('id') + '</h6>')
            break
          }
        }
      }
      element.fill({color: '#7E93B0'})
    })
  }
}

$('#app-body > button').click(function () {
  var id = parseInt($(this).attr('id'))
  if ($.inArray(id, seatAv) > -1) {
    var icon = $('<span class="glyphicon glyphicon-remove" aria-hidden="true" price="' + $(this).attr('price') + '" select-id="' + id + '""></span>')
    icon.click(deleteRow)

    draw.get(id).attr({
      stroke: 'green',
      'stroke-with': 6
    })
    $('#carrello').prepend('<input type="checkbox" hidden value="' + id + '" name="seat" checked><br>')
    $('#carrello').prepend(icon)
    $('#carrello').prepend('<label class="lead"> Posto: ' + id + ' - ' + $(this).attr('price') + '€</label>')
    seatAv.splice((seatAv.indexOf(id)), 1)
    var total = parseFloat($('#price-total').text()) + parseFloat($(this).attr('price'))
    $('#price-total').text(total.toFixed(2) + '€')
  } else {
    $('#app-error').fadeIn(800)
  }
})

function deleteRow () {
  seatAv.push(parseInt($(this).attr('select-id')))
  var total = parseFloat($('#price-total').text()) - parseFloat($(this).attr('price'))
  console.log(total)
  $('#price-total').text(total.toFixed(2) + '€')
  $('input').remove('[value="' + $(this).attr('select-id') + '"]')
  $('label').remove(':contains(' + $(this).attr('select-id') + ' -)')
  $('span').remove('[select-id="' + $(this).attr('select-id') + '"]')
}

$('#changer').click(function () {
  if(Cookies.get('BIuser_session') === undefined) {
    $('#carrello').prepend('<div class="form-group"> <label class="col-sm-2 control-label">Nome</label> <div class="col-sm-10"> <input type="text" class="form-control" name="nome" placeholder="Nome" required> </div> </div> <div class="form-group"> <label class="col-sm-2 control-label">Cognome</label> <div class="col-sm-10"> <input type="text" class="form-control" name="cognome" placeholder="Cognome" required> </div> </div> <div class="form-group"> <label class="col-sm-2 control-label" >Nome Allievo</label><div class="col-sm-10"><input type="text" class="form-control" name="allievo" placeholder="Cognome Allievo" required></div> </div>')
    Cookies.set('BIuser_session', 'hey')
  } else {
    if ($('input.form-control').filter(function() { return $(this).val() }).length > 2) {
      var bigDiv = $('<div class="loading"></div>').css({'width': $(window).width(), 'height': $(window).height()})
      bigDiv.append('<div id="block_1" class="barlittle"></div>')
      bigDiv.append('<div id="block_2" class="barlittle"></div>')
      bigDiv.append('<div id="block_3" class="barlittle"></div>')
      bigDiv.append('<div id="block_4" class="barlittle"></div>')
      bigDiv.append('<div id="block_5" class="barlittle"></div>')
      $.post(APIurl + '/checkout', $('#carrello').serializeArray(), loaded).fail(function (xhr, textStatus) {
        $('.loading').remove()
        $('body').prepend('<div class="alert alert-danger" role="alert"><strong> Oh snap! </strong> ' + xhr.responseJSON + '</div>')
        console.log('API response: ' + textStatus)
      })
      $('body').append(bigDiv)
    } else {
       $('input.form-control').each(function () {
         $(this).attr('placeholder', 'Campo Obbligatorio')
       })
    }
  }
})
$('#check').click(function () {
  $.ajax({
    url: APIurl + '/checkCode',
    method: 'POST',
    data: {code: $('#app-code').val()}
  }).done(function (json, textStatus) {
    $('body').prepend('<div class="alert alert-success">Posti confermati!</div>')
    console.log('API response: ' + textStatus)
    window.location.reload()
  })
  .fail(function (xhr, textStatus) {
    $('body').prepend('<div class="alert alert-danger">Codice Errato</p>')
    console.log('API response: ' + textStatus)
  })
})
function removeTx (code) {
  if (confirm('Eliminare l\'ordine?') == true) {
    $.ajax({
      url: APIurl + '/checkCode',
      method: 'DELETE',
      data: { code: code}
    }).done(function (json, textStatus) {
      window.location.reload()
    })
  }
}

function loaded (json, textStatus) {
  console.log(json)
  window.location = json.url
}
