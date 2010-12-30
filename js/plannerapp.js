;var Planner = {
  prefix: '',
  unitHeight: 10, // in pixels
  unitTime: 5,   // "least count" in minutes
  step: 15,       // steps in timeline (mins)
  defaultDuration: 45, // default duration in minutes

  epoch: undefined,
  dateFormat: $.datepicker.RFC_1123,
  exportDateFormat: 'yy-mm-dd',
  valueStore: "valuestore.php",

  // save a key-value pair on the server.
  save: function(key, val) {
    key = Planner.prefix + key,
    val = JSON.stringify(val);
    $.ajax({
      url: this.valueStore,
      type: 'POST',
      data: { key: key, value: val },
      success: function(data, status, xhr) {
        Planner.notify('Saved!');
      },
      error: function(data, status, thro) {
        console.log(status);
        Planner.notify('There was an error while saving data!', 1);
      }
    });
  },

  // get the value of a key from the server.
  get: function(key, callback_success, callback_error) {
    key = Planner.prefix + key;
    $.ajax({
      url: this.valueStore,
      type: 'GET',
      data: { key: key },
      cache: false,
      success: function(data, status, xhr) {
        if(typeof(callback_success) != 'undefined')
          callback_success(data);
      },
      error: function(data, status, thro) {
        if(typeof(callback_error) != 'undefined')
          callback_error(data);
      }
    });
  },

  notify: function(msg, error) {
    $('#notification').html(msg).attr('class', error?'error':'success')
    .fadeIn(500, function() {
      setTimeout('$("#notification").fadeOut()', 3000);
    });
  },

  setDate: function(dateobj) {
    if (typeof(Planner.epoch) == 'undefined') {
      Planner.epoch = new Date(dateobj.getTime());
      console.log('Date set. epoch='+Planner.epoch.toString());
      // first run. Load default epoch
      Planner.setEpoch(Planner.strToTime($("#epoch [name=epoch]").val()));
      return;
    }

    Planner.epoch.setDate(dateobj.getDate());
    Planner.epoch.setMonth(dateobj.getMonth());
    Planner.epoch.setFullYear(dateobj.getFullYear());
  },

  setEpoch: function(dateobj) {
    Planner.epoch = new Date(dateobj.getTime());
    $('#epoch [name=epoch]').val(Planner.timeToStr(Planner.epoch));
    $('#date').val($.datepicker.formatDate(Planner.dateFormat, Planner.epoch));

    $('#timeline .step').remove();
    console.log('Time set. epoch='+Planner.epoch.toString());
    Planner.fillTimeline(dateobj);
  },

  getInterval: function(item) {
    var interval = {},
      start = item.parents('.track').find('.item:first')
        .position().top - item.position().top,
      tmp = new Date(this.epoch.getTime());

    interval['start'] = tmp.setMinutes(tmp.getMinutes()
      + start * (this.unitTime / this.unitHeight))
    interval['end'] = tmp.setMinutes(tmp.getMinutes()
      + item.outerHeight() * (this.unitTime / this.unitHeight))
    return interval;
  },

  // do the reverse of dump()
  load: function(obj) {
    try {
      var t =  new Date(obj[0].events[0].start);
      console.log(t);
      Planner.setEpoch(t);
    } catch(er) {
      alert("Could not set start time. Please set one yourself");
    }

    $('.track-wrap').remove();

    $.each(obj, function(i, track) {
      Planner.newTrack(track);
    });
  },

  dump: function() {
    var obj=[], tracktmp, track_pos, interval;
    $('.track-wrap').each(function() {
      tracktmp = {name: $(this).find('.track-head h2').text()};
      tracktmp['events'] = [];

      $(this).find('.track .item').each(function() {
        var tmp = {};
        $(this).find('.field').each(function() {
          tmp[$(this).attr('data-rel')] = $(this).html();
        });

        // fill in start and end time
        interval = Planner.getInterval($(this));
        tmp['start'] = interval.start;
        tmp['end']   = interval.end;

        tracktmp['events'][tracktmp['events'].length] = tmp;
      });
      obj[obj.length] = tracktmp;
    });
    return obj;
  },

  strToTime: function(str) {
    var t=$.datepicker.formatDate('mm/dd/yy ', Planner.epoch)
       + str.replace('am', ' am').replace('pm', ' pm');
    var s = Date.parse(t);
    t = new Date();
    t.setTime(s);

    return t;
  },

  timeToStr: function(obj, incr) {
    if (typeof(incr) == 'undefined') incr = 0;
    obj.setMinutes(obj.getMinutes() + incr);
    var h = obj.getHours(), m = obj.getMinutes(),
      // Pissing on all those who use 24-hour time. :P
      suf = h<12? 'am':'pm';

    h = h>12? h-12: h==0? 12:h;
    h = (h<10 ? '0':'') + h;
    m = (m<10 ? '0':'') + m;

    return h+':'+m+suf;
  },

  timeToHeight: function(time) {
    return time * (Planner.unitHeight / Planner.unitTime);
  },

  heightToTime: function(el) {
    return Math.floor((1.0 * Planner.unitTime
      / Planner.unitHeight) * el.outerHeight());
  },

  fillTimeline: function(epoch) {

    if (typeof(epoch) == "string") epoch = Planner.strToTime(epoch);

    if (typeof(epoch) == 'undefined' && $('#timeline .step').length > 0) {
      // adjust height
      epoch = Planner.strToTime($('#timeline .step:last').text());
    }

    var step=Planner.timeToHeight(Planner.step),
      cnt=Math.ceil($("#timeline").height() / step),
      i=0;
    cnt -= $("#timeline .step").length;

    $("#timeline form").height(step-1);
    for(i=0; i<cnt; i++) {
      var tstr = Planner.timeToStr(epoch, Planner.step);
      $("#timeline").append(
        $('<div class="step"/>').text(tstr).height(step-1)
      );
    }
  },

  adjustTrackWidth: function() {
    var width = 890 / $('.track-wrap').length - 3;
    $('.track-wrap').width(width);
    $('.item').css('width', 'auto');
  },

  newItem: function(data) {
    var fillIn = function(e, item) {
      $.each(item, function(k,v) {
        try { e.find('[data-rel='+k+']').html(v); }
        catch(er) { console.log(er.description); }
      });
      var h = (typeof(item.duration) != 'undefined') ?
        item.duration :
        Math.round((item.end - item.start) / 60000);

      e.data('outerH', Planner.timeToHeight(h));
      return e;
    },

    newitem = $('<li class="vevent item"/>')

      .html($("#template").val())
      .prepend($('<span class="icon sort-handle"/>'))

      .prepend($('<span class="icon close"/>')
        .click(function(){
          $(this).parents('.item').eq(0).fadeOut(function(){
            $(this).remove();
          });
        }))

      .append($('<span class="duration"/>').text(
        Planner.defaultDuration+'min'))

      .resizable({handles: 's'})
      .resize(function() {
        var t = Planner.heightToTime($(this));
        $(this).find('.duration').text(t + ' min');
      })

      .find('.field').attr('contenteditable', true).end();

      return (typeof(data) == 'undefined') ? newitem :
        fillIn(newitem, data);
  },

  newTrack: function (items) {
    if (!$.isPlainObject(items))
      items = { name: items, events: [Planner.newItem()] };

    var track = $('<ul class="track"/>').append(), trackwrap,
      // header and options
      head = $('<div class="track-head"/>')
      .append($('<h2 contenteditable="true">' +items.name+ '</h2>'))
      .append($('<small class=deltrack>Delete</small>').click(function(){
        var tr=$(this).parents('.track-head').find('h2').text();
        if (confirm('Are you sure you want to delete track '+tr+ '?')) {
          $(this).parents('.track-wrap').remove();
          Planner.adjustTrackWidth();
        }
      })).append($('<small class=newitem>New item &rarr;</small>')
        .click(function(){
          $(this).parents('.track-wrap').find('.track')
            .append(Planner.newItem().hide().fadeIn());
        })
      );

    if (typeof(track.sortable != 'undefined'))
      track.sortable({ handle: '.sort-handle', connectWith: '.track'});
    else $('.sort-handle').remove();

    for(i in items.events) {
      track.append(Planner.newItem(items.events[i]));
    }

    $('#table').append(
      trackwrap = $('<div class="track-wrap"/>')
        .append(head)
        .append(track)
      .hide().fadeIn()
    );

    trackwrap.find('.item').each(function() {
      if ($(this).data('outerH') != NaN) {
        var diff = $(this).outerHeight() - $(this).height();
        $(this).height($(this).data('outerH') - diff);
        $(this).data('outerH', NaN);
      }
    });

    $('#timeline').add('#planner-instructions form').fadeIn();

    Planner.adjustTrackWidth();
    return track;
  },

  init: function(params) {
    $.each(params, function(k, v) {
      Planner[k] = v;
    });

    $("#table .item").live('mouseover mouseout', function(event) {
      $(this).find('.icon')[event.type=='mouseover'?'show':'hide']();
    }).live('resizestop', function() {
      // snap to nearest unit height.
      var oh=$(this).outerHeight(),
        h=$(this).height(),
        rnd = Math.round(1.0 * oh / Planner.unitHeight) * Planner.unitHeight;

        $(this).height(rnd - (oh-h));
    });

    $("#table .item .field").attr('contenteditable', true)
      .live('keydown',function(e) {

        var self = $(this).parents('.item').eq(0);

        if ((e.keyCode == 38 || e.keyCode == 40) && e.ctrlKey) {

          self.height(self.height()
            + (e.keyCode==40? 1:-1) * Planner.unitHeight);
        }

        // {shift}+ctrl+enter
        if (e.keyCode == 13 && e.ctrlKey) {
          if (!e.shiftKey && !self.next().is('.item'))
            self.after(Planner.newItem().hide().fadeIn());
          self[(e.shiftKey)? 'prev':'next']().find('.field:first').focus();
        }
    });

    $("#table-wrap").resize(function() {
      var h=$(this).height();
      $("#timeline").height(h);

      Planner.fillTimeline();
    });

    $("#timeline #epoch [name=epoch]").keydown(function(e) {
        if(e.keyCode==13) $(this).parents('form').submit();
    }).timeEntry({
        timeSteps: [1, Planner.unitTime, 1],
        spinnerImage: '',
        ampmNames: ['am','pm'],
    });

    $('#date').datepicker({
      onSelect: function(txt, inst) {
        $(inst.input[0]).parents('form').submit();
      },
      dateFormat: Planner.dateFormat
    });

    this.get('template', function(data) {
      if (typeof(data) == "string") {
        $("#template").val(data);
      }
    });
    this.get('default', this.load);
  }
};
