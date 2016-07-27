function main(){
    // --- nav scripts ---
    $("input").keyup( function(event) {
        if(event.keyCode == 13){
            $(".go-button").click();
        }
    });

    $(".dropdown").hover(function(){
        $(".dropdown-toggle", this).trigger("click");
    });

    $(".dropdown-toggle").click(function() {
        $(this).next(".dropdown-menu").fadeToggle(200);
    });

    // For the Second level Dropdown menu, highlight the parent
    $( ".dropdown-menu" )
        .mouseenter(function() {
            $(this).parent('li').addClass('active');
        })
        .mouseleave(function() {
            $(this).parent('li').removeClass('active');
        });

    $('.table-row').trigger('create');
}
$(document).ready(main);