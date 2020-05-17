$(document).ready(
    function() {
        /*
         board settings or preferences
        */
        var highLightLastmove = true;
        var showCoordinates   = true;
        var showLegal         = true;
        // var for pref
        var blackSquareGrey   = '#696969';
        var colorToHighlight  = null;
        var squareClass       = 'square-55d63';
        var squareToHighlight = null;
        var whiteSquareGrey   = '#a9a9a9';

        let black_in = "#222222";
        let white_in = "#e6f1ff";

        /*
          game playing states/mode
        */
        let html_chess_uc = {
            'N': '\u2658',
            'B': '\u2657',
            'R': '\u2656',
            'Q': '\u2655',
            'K': '\u2654'
        };
        var humanVsCompMode   = false;
        var solvingpuzzleMode = false;
        var gettingHint       = false;
        // vars for modes
        let black_player   = "human";
        let white_player   = "human";
        let human_player   = "";
        let computer_player = "";
        let board          = null;
        let $board         = $('#board1');
        let board_temp     = null;
        let computer_level = 1;
        let currentPuzzle  = "";
        let game           = new Raccoon();
        let raccoon_engine = new Worker('lib/raccoon.js');
        let book_path      = "js/book.bin";
        let moveHistory    = null;
        let $pgn           = $('#pgn_dis');
        let puzzle_itr     = 0;
        let seenPuzzle     = new Set();
        let last_move      = "";
        let move_count     = 1;
        let piece_promotion = "q";
        let auto_queen    = false;
        let promotion_picked = false;
        let engine_analyzing = false;
        let time = {wtime: 300000, btime: 300000, winc: 2000, binc: 2000};
        let clock_timeout_id = null;

        //raccoon_engine.postMessage('setoption name UCI_BookPath value C:\\Users\\Edegw\\Desktop\\PersonalSiteV3\\js\\book.bin');
        let request = new XMLHttpRequest();
        request.open('GET', book_path, true);
        request.responseType = 'arraybuffer';
        request.onload = function(e) {
            if (request.status === 200) {
                raccoon_engine.postMessage({book: request.response});
                console.log(request.response)
            } else {
                console.error("Book failed to load");
            }
        };
        request.send(null);


        /*
         hardcoded variables
        */
        let chess_level = {
            1:"Fool",
            2:"Beginner",
            3:"Rookie",
            4:"Novice",
            5:"Primary",
            6:"Intermediate",
            7:"Advanced",
            8:"Expert",
            9:"Master",
            10:"Grandmaster"
        };

        let puzzle = {
            'r1b1kb1r/pppp1ppp/5q2/4n3/3KP3/2N3PN/PPP4P/R1BQ1B1R b kq - 0 1':['Bc5+', 'Kxc5', 'Qb6+', 'Kd5', 'Qd6#'],
            'rnbk1b1r/ppqpnQ1p/4p1p1/2p1N1B1/4N3/8/PPP2PPP/R3KB1R w - - 0 1':['Qe8+', 'Kxe8', 'Nf6+', 'Kd8', 'Nf7#'],
            'r5k1/q4ppp/rnR1pb2/1Q1p4/1P1P4/P4N1P/1B3PP1/2R3K1 w - - 0 1':['Rc8+', 'Rxc8', 'Rxc8+', 'Nxc8', 'Qe8#'],
            '3r2qk/p2Q3p/1p3R2/2pPp3/1nb5/6N1/PB4PP/1B4K1 w - - 0 1':['Bxe5', 'Rxd7', 'Rf7+', 'Qg7', 'Rf8#'],
            '5bk1/1Q3p2/1Np4p/6p1/8/1P2P1PK/4q2P/8 b - - 0 1':['f5', 'Qxc6', 'g4+', 'Kh4', 'Qxh2#']
        };

        /*
          Helper functions for preferences
        */
        function removeHighlights (color) {
            $board.find('.' + squareClass)
                .removeClass('highlight-' + color)
        }
        function removeGreySquares () {
            $('#board1 .square-55d63').css('background', '')
        }
        function greySquare (square) {
            var $square = $('#board1 .square-' + square);

            var background = whiteSquareGrey;
            if ($square.hasClass('black-3c85d')) {
                background = blackSquareGrey
            }

            $square.css('background', background)
        }
        function onMouseoverSquare (square, piece) {
            // get list of possible moves for this square
            let moves = game.moves({
                square: square,
                verbose: true
            });

            // exit if there are no moves available for this square
            if (moves.length === 0 || !showLegal) return;

            // highlight the square they moused over
            greySquare(square);

            // highlight the possible squares for this piece
            for (var i = 0; i < moves.length; i++) {
                greySquare(moves[i].to);
            }
        }
        function onMouseoutSquare (square, piece) {
            removeGreySquares();
        }

        function game_result() {
            alert("game is over");
            engine_analyzing = true;
            /*TODO tell the final result of game stalemate, win on time, insufificent etc*/
        }

        /*
          Helper functions game state/mode
        */
        function display_clock(color, t) {
            let running = false;
            if(time.startTime > 0 && color === time.clock_color) {
                t = Math.max(0, t + time.startTime - Date.now());
                running = true;
            }
            let id = (color === board.orientation() ? '#bottom_player_time' : '#top_player_time');
            let id_other =  (color === board.orientation() ?  '#top_player_time': '#bottom_player_time');
            let sec = Math.ceil(t / 1000);
            let min = Math.floor(sec / 60);
            sec -= min * 60;
            let hours = Math.floor(min / 60);
            min -= hours * 60;
            let display = hours + ':' + ('0' + min).slice(-2) + ':' + ('0' + sec).slice(-2);
            if(running) {
                $(id_other).css('background-color', '#172a45');
                let bc;
                if (min === 0 && hours === 0 && sec <= 10){
                    bc = sec & 1 ? '#FF0000' : '#d80000';
                } else{
                    bc = sec & 1 ? '#64ffd9' : '#4ed4b4';
                }
                $(id).css('background-color', bc);
            }

            $(id).text(display);
            if (t === 0){
                game_result();
            }

        }

        function update_clock() {
            if(!engine_analyzing){
                display_clock('white', time.wtime);
                display_clock('black', time.btime);
            }
        }

        function clock_tick() {
            update_clock();
            let t = (time.clock_color === 'white' ? time.wtime : time.btime) + time.startTime - Date.now();
            let time_t_next_second = (t % 1000) + 1;
            clock_timeout_id = setTimeout(clock_tick, time_t_next_second);
        }

        function stop_clock() {
            if(clock_timeout_id !== null) {
                clearTimeout(clock_timeout_id);
                clock_timeout_id = null;
            }
            if(time.startTime > 0) {
                let elapsed = Date.now() - time.startTime;
                time.startTime = null;
                if(time.clock_color === 'white') {
                    time.wtime = Math.max(0, time.wtime - elapsed);
                } else {
                    time.btime = Math.max(0, time.btime - elapsed);
                }
            }
        }

        function start_clock() {
            if(game.turn() === 'w') {
                time.wtime += time.winc;
                time.clock_color = 'white';
            } else {
                time.btime += time.binc;
                time.clock_color = 'black';
            }
            time.startTime = Date.now();
            clock_tick();
        }

        function reset_board2(){
            let height  = parseInt($('#board2').height());
            let new_width = (height*0.75);
            $('#board2').css("width",`${new_width}px`);
        }
        function get_nextPuzzle() {
            set_time(5*60, 0);
            update_clock();
            new_game();
            removeHighlights('white');
            removeHighlights('black');
            if(solvingpuzzleMode){
                for (let key in puzzle) {
                    game.reset();
                    if (!seenPuzzle.has(key)) {
                        if (game.load(key)) {
                            board.position(game.fen());
                            seenPuzzle.add(key);
                            currentPuzzle=key;
                            puzzle_itr = 0;
                            if(game.turn() == 'b'){
                                black_player = "human"
                                board.orientation('black');
                                white_player = "puzzle_solver"
                            }
                            else{
                                white_player = "human"
                                black_player = "puzzle_solver"
                                board.orientation('white');
                            }
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        function replyToPuzzle(){
            let move = puzzle[currentPuzzle][puzzle_itr];
            if((black_player =="puzzle_solver" && game.turn() == 'b') ||
                (white_player =="puzzle_solver" && game.turn() == 'w')){
                puzzle_itr++;
                last_move = game.move(move);
                if(highLightLastmove){
                    colorToHighlight = (black_player === "puzzle_solver")? 'black':'white';
                    removeHighlights(colorToHighlight);
                    $board.find('.square-' + last_move.from).addClass('highlight-'+colorToHighlight);
                    squareToHighlight = last_move.to;
                }
                board.position(game.fen());
                updateStatus();
            }
        }
        function updateStatus() {
            let status = '';
            let number_moves = game.history().length;
            if((moveHistory === null) ||
                (moveHistory.length <= number_moves) ||
                (moveHistory[number_moves - 1] !== game.history()[number_moves - 1])){
                moveHistory    = game.history({verbose: true});
            }
            let moveColor = 'White';
            if (game.turn() === 'b') {
                moveColor = 'Black'
            }

            // checkmate?
            if (game.in_checkmate()) {
                status = 'Game over, ' + moveColor + ' is in checkmate.'
            }

            // draw?
            else if (game.in_draw()) {
                status = 'Game over, drawn position'
            }

            // game still on
            else {
                status = moveColor + ' to move'

                // check?
                if (game.in_check()) {
                    status += ', ' + moveColor + ' is in check'
                }
            }
            let i = 0;
            let move_string = "";
            if(last_move.color === 'w'){
                move_string += move_count.toString() + '.';
                move_count++;
            }
            if (last_move && last_move.san[0] in html_chess_uc){
                move_string += (html_chess_uc[last_move.san[0]]);
                i = 1;
            }
            move_string += last_move.san.substr(i) + " ";
            $pgn.append(move_string);
        }
        function set_time(base_time, inc){
           time = { wtime: base_time * 1000, btime: base_time * 1000, winc: inc * 1000, binc: inc * 1000 };
        };

        function set_uci_board() {
            let moves = '';
            let history = game.history({verbose: true});
            for(let i = 0; i < history.length; ++i) {
                let move = history[i];
                moves += ' ' + move.from + move.to + (move.promotion ? move.promotion : '');
            }
            if (moves) {
                raccoon_engine.postMessage('position startpos moves' + moves);
            }
            else{
                raccoon_engine.postMessage('uci');
                raccoon_engine.postMessage('isready');
                raccoon_engine.postMessage('ucinewgame');
            }
        }
        function ChessAI() {
            if((black_player === computer_player && game.turn() === 'b') ||
                (white_player === computer_player && game.turn() === 'w') ||
                (gettingHint)){
                /*let move = game.search({verbose: true});
                if(move === null) return;*/
                set_uci_board();
                raccoon_engine.postMessage('go wtime ' + time.wtime + ' winc ' + time.winc + ' btime ' + time.btime + ' binc ' + time.binc);
            }
        }


        raccoon_engine.onmessage = function(event) {
            let line = event.data;
            let match;
            if(line.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbk])?/)) {
                match = line.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbk])?/);
                last_move = game.move({from: match[1], to: match[2], promotion: match[3]});
                if(highLightLastmove){
                    if (highLightLastmove) {
                        highlight_move(last_move)
                    }
                }
                board.position(game.fen());
                if(game.in_checkmate()){
                    alert(colorToHighlight + " checkmated!");
                }
                if(!solvingpuzzleMode){
                    stop_clock();
                    update_clock();
                    start_clock();
                }
                updateStatus();
            }
            else if(line.match(/^info .*\bdepth (\d+)/)) {
                match = line.match(/^info .*\bdepth (\d+)/);
                console.log(match[1]);
                $('#depth').html(match[1]);
            }
            if(line.match(/^info .*\bscore (\w+) (-?\d+)/)) {
                match = line.match(/^info .*\bscore (\w+) (-?\d+)/);
                let score = parseInt(match[2]) * (game.turn() === 'w' ? 1 : -1);
                let score_string;
                if(match[1] === 'cp') {
                    score_string = (score / 100.0).toFixed(2);
                } else if(match[1] === 'mate') {
                    score_string = '#' + score;
                }
                if(line.match(/\b(upper|lower)bound\b/)) {
                    match = line.match(/\b(upper|lower)bound\b/);
                    score_string = ((match[1] === 'upper') === (game.turn() === 'w') ? '<= ' : '>= ') + score_string
                }

                if(score > 0) {
                    $('#best_score').css( 'background-color', white_in);
                }
                else {
                    $('#best_score').css( 'background-color', black_in);
                }
                $('#best_score').html(score_string);
                $('#pv_score1').html(score_string);
            }
            if(line.match(/^info .*\bpv\s*(.*)/)){
                match = line.match(/^info .*\bpv\s*(.*)/);
                let pv_lines = match[1].split(' ');
                $('#pv_line1').html(match[1])
                /*TODO do something with PV LINE
                *
                *             /*$('#pv_line2').append(move_string);
            $('#pv_line1').append(move_string);
            $pgn.animate({
                scrollLeft: ($pgn.get(0).scrollWidth - $pgn.get(0).clientWidth)
            },500);
            $('#pv_line1').animate({
                scrollLeft: ( $('#pv_line1').get(0).scrollWidth - $('#pv_line1').get(0).clientWidth)
            },500);
            $('#pv_line2').animate({
                scrollLeft: ($('#pv_line2').get(0).scrollWidth - $('#pv_line2').get(0).clientWidth)
            },500);*/
            }
        };

        function option_btn() {
            auto_queen = $('#auto_queen').is(':checked');
            showLegal =  $('#showLegalMove').is(':checked');
            highLightLastmove = $('#highLightLastMove').is(':checked');
            showCoordinates   = $('#showCoordinates').is(':checked');
        }
        option_btn();
        /*
            Main game Events
        */

        //Trigger when a piece is picked
        function onDragStart (source, piece) {
            if (game.game_over()) return false;
            // only pick up pieces for the side to move
            if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
                (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
                return false
            }
        }

        function highlight_move(move) {
            if (move.color === 'w') {
                removeHighlights('white');
                $board.find('.square-' + move.from).addClass('highlight-white');
                squareToHighlight = move.to;
                colorToHighlight = 'white'
            } else {
                removeHighlights('black');
                $board.find('.square-' + move.from).addClass('highlight-black');
                squareToHighlight = move.to;
                colorToHighlight = 'black'
            }
        }

        //Triggers when a piece is dropped
        function onDrop (source, target) {
            removeGreySquares();
            // see if the move is legal
            last_move = game.move({
                from: source,
                to: target,
                promotion: piece_promotion
            });
            // illegal move
            if (last_move === null) return 'snapback';
            piece_promotion = 'q';
            if (last_move.flag === 'p' || last_move.flag === 'pc'){
                if (!auto_queen && !promotion_picked){
                    $('#promotion_option').fadeIn();
                    $('#chess_wrapper>*:not(#promotion_option)').css("filter","blur(4px)");
                    promotion_picked = false;
                    return 'snapback';
                }
            }
            if (highLightLastmove) {
                highlight_move(last_move)
            }
            updateStatus();
            if (humanVsCompMode) window.setTimeout(ChessAI, 300);
            else if (solvingpuzzleMode) {
                if (puzzle[currentPuzzle][puzzle_itr] != last_move.san) {
                    alert("Wrong, try again");
                    game.undo();
                    return;
                }
                else {
                    if (puzzle[currentPuzzle].length - 1 == puzzle_itr) {
                        alert("Excellent");
                        if (!get_nextPuzzle()) {
                            alert("All puzzle are solved!");
                            removeHighlights('white');
                            removeHighlights('black');
                            solvingpuzzleMode = false;

                        }
                        return;
                    } else {
                        puzzle_itr++;
                        window.setTimeout(replyToPuzzle, 300);
                    }

                }
            }
            if(game.in_checkmate()){
                let color = (last_move.color === 'w')? 'white':'black';
                alert(color + " checkmated!");
            }

        }

        // update the board position after the piece snap
        // for castling, en passant, pawn promotion
        function onSnapEnd () {
            if(!solvingpuzzleMode){
                stop_clock();
                update_clock();
                start_clock();
            }
            board.position(game.fen())
        }

        //Triggers at end of animation, when board position changes
        function onMoveEnd () {
            if(highLightLastmove) {
                $board.find('.square-' + squareToHighlight)
                    .addClass('highlight-' + colorToHighlight);
            }

        }
        var config = {
            draggable: true,
            showNotation: showCoordinates,
            position: 'start',
            moveSpeed: 'slow',
            snapbackSpeed: 500,
            snapSpeed: 100,
            onDragStart: onDragStart,
            onDrop: onDrop,
            onMoveEnd: onMoveEnd,
            onMouseoutSquare: onMouseoutSquare,
            onMouseoverSquare: onMouseoverSquare,
            onSnapEnd: onSnapEnd
        };
        board = Chessboard('board1', config);

        $( ".engine_strength" ).bind('keyup mousemove', function() {
            computer_level = $( this ).val();
            var display = `${computer_level} (${chess_level[parseInt(computer_level)]})`;
            $('.strength').text(display);
        });
        $(window).resize(function() {
            if (board) board.resize();
            reset_board2();
            if (board_temp) board_temp.resize();
        });
        $('#chess_flip').click(function () {
            board.flip();
            let tmp = $('#bottom_player').html();
            $('#bottom_player').html($('#top_player').html());
            $('#top_player').html(tmp);
            let tmpid="mskfnsnnsjnskjnasnfa";
            $('#bottom_player_time').attr('id', tmpid);
            $('#top_player_time').attr('id', 'bottom_player_time');
            $(`#${tmpid}`).attr('id', 'top_player_time');

        });
        $('#chess_analyze').click(function () {
            $('#analysis_board').toggle();
            /* TODO show analysos */

        });
        $('#ok_promotion').click(function (){
            if($('#queen').is(':checked')){
               piece_promotion = 'q';
            }
            else if ($('#queen').is(':checked')){
                piece_promotion = 'q';
            }
            else if ($('#rook').is(':checked')){
                piece_promotion = 'r';
            }
            else if ($('#bishop').is(':checked')){
                piece_promotion = 'b';
            }
            else if ($('#knight').is(':checked')){
                piece_promotion = 'n';
            }
            $('#chess_wrapper>*:not(#promotion_option)').css("filter","blur(0)");
            $('#promotion_option').fadeOut();
            promotion_picked = true;
            let move = game.undo();
            let t = onDrop(move.from, move.to);
            board.position(game.fen());
        });

        $('#chess_back').click(function () {
            last_move = game.undo();
            if (last_move){
                let curr = $pgn.html();
                let end = 1;
                if (last_move.color === 'w'){
                    end = 3;
                    move_count--;
                }
                $pgn.html(curr.substr(0, curr.length - last_move.san.length - end));
                board.position(game.fen());
                if(solvingpuzzleMode) puzzle_itr--
            }
        });
        $('#chess_forward').click(function () {
              if(game.history().length < moveHistory.length){
                  last_move = moveHistory[game.history().length];
                  game.move(last_move);
                  board.position(game.fen());
                  updateStatus();
                  if(solvingpuzzleMode) puzzle_itr++
            }

        });
        let isDown = false;
        let startX;
        let scrollLeft;
        let slider = document.querySelector('.horizontal_scroll');
        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });
        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.classList.remove('active');
        });
        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.classList.remove('active');
        });
        slider.addEventListener('mousemove', (e) => {
            if(!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 3; //scroll-fast
            slider.scrollLeft = scrollLeft - walk;
        });


        $('#share').click(function () {
            let date = new Date();
            let rlt_str = (game.turn() =="w")? "0 1": "1 0";
            let result= (game.in_checkmate()  && game.game_over())? rlt_str: "*";
            let history = game.history({verbose: true});

         game.header('Event',"Michael Edegware's Website",
             'Site', 'michaeledegware.com',
             'Date', (new Date()).toString(),
             'White', white_player,
             'Black', black_player,
             'Result', "*"
         );
         window.location.href = 'mailto:?subject=Chess Game - michaeledegware.com&body='+game.pgn();
        });

        $('#show_line').click(function () {
            $('#pv_lines').toggle();
        });

        $('#chess_home').click(function () {
            $('#chess_wrapper>*:not(#chess_home_menu_options, #chess_new_games, #humanVShuman, #humanVScomputer, #load_game_menu, #setup_board, #chess_option)').css("filter","blur(5px)");
            $('#chess_home_menu_options').show();
        });
        $('#close_chess_home').click(function () {
            $('#chess_wrapper>*:not(#chess_home_menu_options)').css("filter","blur(0)");
            $('#chess_home_menu_options').hide();

        });
        $('#new_game').click(function () {
            $('#chess_new_games').fadeIn();
        });
        $('#close_new_game').click(function () {
            $('#chess_new_games').fadeOut();
        });
        $('#puzzle').click(function () {
            solvingpuzzleMode = true;
            humanVsCompMode   = false;
            if(!get_nextPuzzle()){
                alert("You've solved all puzzle!");
                new_game();
            }
            $('#chess_home_menu_options').hide();
            $('#chess_wrapper>*:not(#chess_home_menu_options)').css("filter", "blur(0)");
        });
        function new_game(){
            removeHighlights('white');
            removeHighlights('black');
            $('#top_player_time').css('background-color', "#172a45");
            $('#bottom_player_name').css('background-color', "#172a45");
            game.reset();
            board.position(game.fen());
            $pgn.empty();
            $('#chess_home_menu_options').hide();
            $('#chess_new_games').hide();
            $('#chess_wrapper>*:not(#chess_home_menu_options)').css("filter","blur(0)");
        }
        $('#h_vs_h').click(function () {
            $('#humanVShuman').fadeIn();
        });
        $('#ok_h_vs_h').click(function () {
            $('#humanVShuman').fadeIn();
            black_player  = $('#hvshblack').val();
            white_player  = $('#hvshwhite').val();
            let base_time =  parseFloat($('#basetimehvh').val()) * 60;
            let inc       =  parseFloat($('#inchvh').val());
            set_time(base_time, inc);
            solvingpuzzleMode = false;
            humanVsCompMode = false;
            $('#bottom_player_name').html(black_player);
            $('#top_player_name').html(white_player);
            $('#humanVShuman').fadeOut();
            update_clock();
            new_game();
        });
        $('#close_h_vs_h').click(function () {
            $('#humanVShuman').fadeOut();
        });
        $('#close_h_vs_c').click(function () {
            $('#humanVScomputer').fadeOut();
        });
        $('#h_vs_c').click(function () {
           $('#humanVScomputer').fadeIn();
           $('.engine_strength').val(computer_level);
        });
        $('#options').click(function () {
            $('.engine_strength').val(computer_level);
            $('#chess_option').fadeIn();
        });
        $('#close_chess_option').click(function () {
            $('#chess_option').fadeOut();
        });
        $('#save_chess_option').click(function () {
            option_btn();
            board.showNotation = showCoordinates;
            /*update screen if need be*/
            computer_player   = `Raccoon ${computer_level} (${chess_level[parseInt(computer_level)]})`;
            if ($('#bottom_player_name').html().includes("Raccoon")){
                $('#bottom_player_name').html(computer_player);
            }
            if ($('#top_player_name').html().includes("Raccoon")){
                $('#top_player_name').html(computer_player);
            }
            $('#chess_home_menu_options').hide();
            $('#chess_wrapper>*:not(#chess_home_menu_options)').css("filter","blur(0)");
            $('#chess_option').fadeOut();
            /*alert(`highlight: ${highLightLastmove}\n
                   showcoord: ${showCoordinates}\n
                   showlegal: ${showLegal}\
                   level:     ${computer_level}`);*/
        });

        $('#ok_h_vs_c').click(function () {
            new_game();
            solvingpuzzleMode = false;
            humanVsCompMode   = true;
            computer_player   = `Raccoon ${computer_level} (${chess_level[parseInt(computer_level)]})`;
            human_player      = "Guest";

            if($('#black').is(':checked')){
                white_player = computer_player;
                board.orientation('black');
                black_player = human_player;
            }
            else{
                white_player = human_player;
                black_player = computer_player;
                board.orientation('white');
            }
            let base_time =  parseFloat($('#basetimehvc').val()) * 60;
            let inc       =  parseFloat($('#inchvc').val());
            set_time(base_time, inc);
            update_clock();

            $('#bottom_player_name').html(human_player);
            $('#top_player_name').html(computer_player);
            $('#humanVScomputer').fadeOut();

            window.setTimeout(ChessAI, 500);

        });
        $('#load_game').click(function () {
            $("#load_game_menu").fadeIn();

        });
        $('#close_fen_pgn').click(function () {
            $("#load_game_menu").fadeOut();
        });
        $('#load_button').click(function () {
            solvingpuzzleMode = false;
            let pgn_fen =  $('#fen_or_pgn').val();
            //let valid = game.validate_fen(pgn_fen);
            if (valid['valid']) {
                game.load(pgn_fen);
                engine_analyzing = true;
                board.position(game.fen());
            }
            else{
                alert(`Invalid FEN or PNG. Analysis Shows:\n${valid['error_number']} errors\nDetails:\n${valid['error']}`);
            }
            if(engine_analyzing){
                $("#load_game_menu").hide();
                $('#chess_home_menu_options').hide();
                $('#chess_new_games').hide();
                $('#chess_wrapper>*:not(#chess_home_menu_options)').css("filter","blur(0)");
            }

        });
        $('#chess_hint').click(function () {
            if(solvingpuzzleMode){
                alert("Correct move is: " + puzzle[currentPuzzle][puzzle_itr]);
                return
            }
            gettingHint = true;
            ChessAI();
            gettingHint = false;
        });
        $('#close_setup_board').click(function () {
            $('#setup_board').fadeOut();
        })
        $('#set_position').click(function () {
            $('#setup_board').fadeIn();
            reset_board2();

            board_temp = Chessboard('board2', {
                draggable: true,
                dropOffBoard: 'trash',
                sparePieces: true
            });
        });
        $('#clear_btn_sb').click(function () {
            board_temp.clear();
        });
        $('#done_btn_sb').click(function () {
            let fen  = board_temp.fen();
            let side = $('#black_st').is(':checked')? 'b':'w';
            let K  =  $('#K_castlew').is(':checked')? 'K':'';
            let Q  = $('#Q_castlew').is(':checked')? 'Q':'';
            let k  =  $('#k_castleb').is(':checked')? 'k':'';
            let q  = $('#q_castleb').is(':checked')? 'q':'';
            let unpassent = $('#enpass').val();
            let num_move= $('#move_number').val();

            let ranks = fen.split('/');
            //verify castling
            if (K == 'K' && ranks[7][ranks[7].length - 1] !='R'){
                K = "";
            }
            if (Q == 'Q' && ranks[7][0] !='R'){
                Q = "";
            }
            if (k == 'k' && ranks[0][ranks[0].length - 1] !='r'){
                k = "";
            }
            if (q == 'q' && ranks[0][0] !='r'){
                q = "";
            }
            let tmp = K+Q+k+q;
            let castling = (tmp == "")? "-":tmp;

            //verify en passant
            let validateEnPassantTarget = /^(-|[a-h][36])$/.test(unpassent);
            if (!validateEnPassantTarget){
                unpassent = "-";
            }

            let total_fen = `${fen} ${side} ${castling} ${unpassent} 0 ${num_move}`;
            let valid = game.load(total_fen);
            if (!valid['valid']) {
                alert(`Invalid FEN or PNG. Analysis Shows:\n${valid['error_number']} errors\nDetails:\n${valid['error']}`);
            }

            //check for stalemate
            if (game.in_stalemate()){
                alert("Player in stalemate");
                return;
            }
            // invalid move check
            var chess = new Raccoon();
            let side2 = $('#black_st').is(':checked')? 'w':'b';
            let total_fen2 = `${fen} ${side2} ${castling} ${unpassent} 0 ${num_move}`;
            chess.load(total_fen2);
            if(chess.in_check()){
                alert("Invalid position. Opponent is in check and must move instead");
                return;
            }
            // check if king placement is valid
            let cK = 0;
            let ck = 0;
            for (let c of fen){
                if(c == 'K'){
                    cK++;
                }
                if(c =="k"){
                    ck++;
                }

            }
            if(cK !== 1 || ck !== 1){
                alert("Invalid number of kings");
                return;
            }
            // check is en passant is valid

            solvingpuzzleMode = false;
            board.position(total_fen);
            $('#setup_board').fadeOut();
            $("#load_game_menu").hide();
            $('#chess_home_menu_options').hide();
            $('#chess_new_games').hide();
            $('#chess_wrapper>*:not(#chess_home_menu_options)').css("filter","blur(0)");
            board_temp.destroy();

        })


    });