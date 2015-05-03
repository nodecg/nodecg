/* jshint strict: false */
/* global ZeroClipboard */
$(function() {
    var $modal = $('#viewKey');
    var $showBtn = $modal.find('.js-show');
    var $copyBtn = $modal.find('.js-copy');
    var $confirmNewBtn = $modal.find('.js-confirmNew');
    var showing = false;
    var copyTooltipActive = false;
    var copier = new ZeroClipboard($copyBtn[0]);

    // When the modal is hidden, re-hide the key
    $modal.on('hidden.bs.modal', function () {
        $modal.find('.collapse').removeClass('in');
        showing = false;
        $showBtn.html('Show Key');
    });

    $copyBtn.tooltip({
        title: 'Copied to clipboard',
        trigger: 'manual',
        container: '#viewKey'
    });

    // After the key is copied to the clipboard, show a confirmation tooltip
    copier.on('aftercopy', function() {
        if (copyTooltipActive) return;
        copyTooltipActive = true;
        $copyBtn.tooltip('show');
        setTimeout(function() {
            $copyBtn.tooltip('hide');
            copyTooltipActive = false;
        }, 1000);
    });

    $showBtn.click(function() {
        showing = !showing;
        var token = $.cookie('socketToken');
        $('#viewKey-key code').html(token);
        $copyBtn.attr('data-clipboard-text', token);
        $showBtn.html(showing ? 'Hide Key' : 'Show Key');
    });

    $confirmNewBtn.click(function() {
        window.socket.emit('regenerateToken', $.cookie('socketToken'), function(err, newToken) {
            if (err) {
                console.error(err);
                return;
            }

            document.location.reload();
        });
    });

    // Augment the panel info links to contain the key param
    $('.panel-info').each(function(i, el) {
        var $el = $(el);
        var rawUrl = $el.data('rawurl');
        var urlWithKey = rawUrl + '?key=' + $.cookie('socketToken');
        var content = '<a target="_blank" href="'+urlWithKey+'">'+rawUrl+'</a>';
        $el.attr('data-content', content);
    });
});

