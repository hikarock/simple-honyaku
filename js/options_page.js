$('#save').on('click', function(evt) {
  var bingAppId = $('#bing-app-id').val();
  if (bingAppId === '') {
    $("#message").empty().text('Bing Application ID が空です').show().fadeOut(2000);
    return;
  }
  localStorage.setItem('bingAppId', bingAppId);
  $("#message").empty().text('保存しました').show().fadeOut(2000);
});

$('#default').on('click', function(evt) {
  var bingAppId = "6DB16C8155FF50AB1445D8A057BFC6F90840F26A";
  localStorage.setItem('bingAppId', bingAppId);
  $('#bing-app-id').val(bingAppId);
  $("#message").empty().text('保存しました').show().fadeOut(2000);
});

var bingAppId = localStorage.getItem('bingAppId');
$('#bing-app-id').val(bingAppId);
