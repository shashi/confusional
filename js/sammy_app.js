// utility functions
$.extend({
  keys: function(obj) {
    var a=[];
    $.each(obj, function(k){ a.push(k) });
    return a;
  },
  values: function(obj) {
    var a=[];
    $.each(obj, function(k,v){ a.push(v) });
    return a;
  }
})

;(function($){
  var sammy_app = $.sammy(function() {

    this.post('#/track/new', function() {
      var self=this, track=self.params['track'];
      if (track == '')
        return false;

      if (typeof(Planner.epoch) == 'undefined') {
        alert('Set a date first.');
        return false;
      }

      $("#newtrack").val('');
      Planner.newTrack(track)
        .find('.field:first').focus();
    });

    // tab switching
    this.get('#/tab/:name', function() {
      var self=this, name=self.params['name'];
      if (name == '')
        return false;
      $('.selected').removeClass('selected');
      $('[href=#/tab/'+name+']').addClass('selected');
      $('body .tab:visible').fadeOut(function() {
        $('#'+name).fadeIn();
      });
    });

    this.get('#/export', function() {
      switch(this.params['format']) {
      case 'json':
        if (typeof(JSON) == 'undefined' ||
          typeof(JSON.stringify) == 'undefined') {
          alert("Can't be done with this browser, use " +
                "the newest firefox or chrome or something. Kthxbye");
          return false;
        }

        // woohoo!
        window.location = "data:application/json;charset=utf-8,\n" +
            JSON.stringify(Planner.dump());
        break;
      case 'html':
      case 'csv':
        var data = Planner.dump(), csv='';

        $.each(data, function(i, track) {
          //csv += track.name+"\n";
          csv += $.keys(track.events[0]).join(',')+"\n";

          $.each(track.events, function(i, event) {
            // fields may contain commas
            csv += '"'+ $.values(event).join('","')+"\"\n"
          });
        });

        window.location = "data:text/csv;charset=utf-8,\n" + csv
        break;
      };
    });

    this.put('#/config', function() {
      Planner.save('template', this.params['template']);
    });

    this.put('#/timeline/epoch', function() {

      if (typeof(this.params['date']) != 'undefined')
        Planner.setDate(
          $.datepicker.parseDate(Planner.dateFormat, this.params['date']));

      if (typeof(this.params['epoch']) != 'undefined') {
        Planner.setEpoch(Planner.strToTime(this.params['epoch']));
      }
    });

    this.post('#/planner/save', function() {
      Planner.save('default', Planner.dump());
    });

    this.post('#/planner/load', function() {
      Planner.get('default', Planner.load);
    });
  });

  $(function() {
    sammy_app.run();
  });
})(jQuery);
