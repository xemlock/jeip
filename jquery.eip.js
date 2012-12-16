/*!
 * jQuery Edit In Place plugin
 *
 * This version is based on 0.1.2 version of jQuery Edit In Place (JEIP)
 * from http://josephscott.org/code/javascript/jquery-edit-in-place/
 *
 * Version: 0.2.0 (2012-12-16, Xemlock)
 *
 * Copyright (c) 2008 Joseph Scott - released under MIT License
 */
/*
Copyright (c) 2008 Joseph Scott, http://josephscott.org/

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// version: 0.2.0

(function( $ ) {
    $.fn.eip = function( save_url, options ) {
        // Defaults
        var opt = {
            save_url            : save_url,
            method              : "POST",

            save_on_enter       : true,
            cancel_on_esc       : true,
            focus_edit          : true,
            select_text         : false,
            edit_event          : "click",
            select_options      : false,
            data                : false,

            form_type           : "text", // text, textarea, select
            size                : false, // calculate at run time
            max_size            : 60,
            rows                : false, // calculate at run time
            max_rows            : 10,
            cols                : 60,

            savebutton_text     : "SAVE",
            savebutton_class    : "jeip-savebutton",
            cancelbutton_text   : "CANCEL",
            cancelbutton_class  : "jeip-cancelbutton",

            mouseover_class     : false, // no mouseover class
            editor_class        : "jeip-editor",
            editfield_class     : "jeip-editfield",

            hint_text           : 'Click to edit',

            saving_text         : "Saving ...",
            saving_class        : "jeip-saving",

            saving              : '<span id="#{id}" class="#{saving_class}" style="display:none">#{saving_text}</span>',

            start_form          : '<span id="#{id}" class="#{editor_class}" style="display:none">',
            form_buttons        : '<span><input type="button" id="#{save_id}" class="#{savebutton_class}" value="#{savebutton_text}"/> OR <input type="button" id="#{cancel_id}" class="#{cancelbutton_class}" value="#{cancelbutton_text}"/></span>',
            stop_form           : '</span>',

            text_form           : '<input type="text" id="#{id}" class="#{editfield_class}" value="#{value}"/> <br/>',
            textarea_form       : '<textarea cols="#{cols}" rows="#{rows}" id="#{id}" class="#{editfield_class}">#{value}</textarea> <br/>',
            start_select_form   : '<select id="#{id}" class="#{editfield_class}">',
            select_option_form  : '<option id="#{id}" value="#{option_value}" #{selected}>#{option_text}</option>',
            stop_select_form    : '</select>',

            after_save          : function( self ) {
                var $self = $( self );
                for( var i = 0; i < 2; ++i ) {
                    $self.fadeOut( "fast" );
                    $self.fadeIn( "fast" );
                }
            },
            on_error            : function( msg, response ) {
                alert( 'Error: ' + msg );
            },
            prepare_data        : null,
            template            : function( template, values ) {
                var replace = function( str, match ) {
                    return typeof values[match] === "string" || typeof values[match] === "number" ? values[match] : str;
                };
                return template.replace( /#\{([^{}]*)}/g, replace );
            }
        }; // defaults

        if( options ) {
            $.extend( opt, options );
        }

        this.each( function( ) {
            var $this = $( this );

            if (opt.mouseover_class) {
                $this.bind( "mouseenter mouseleave", function() {
                    $( this ).toggleClass( opt.mouseover_class );
                } );
            }

            $this.attr( 'title', opt.hint_text );
            $this.bind( opt.edit_event, function() {
                _editMode( this );
            } )
        } ); // this.each

        // Private functions
        var _editMode = function( self ) {
            var $self = $( self );

            $self.unbind( opt.edit_event );

            $self.removeClass( opt.mouseover_class );
            $self.fadeOut( "fast", function() {
                var id      = self.id;
                var value   = $( self ).html( );

                var safe_value  = value.replace( /</g, "&lt;" );
                safe_value      = value.replace( />/g, "&gt;" );
                safe_value      = value.replace( /"/g, "&qout;" );

                var orig_option_value = false;

                var form = opt.template( opt.start_form, {
                    id              : "jeip-editor-" + self.id,
                    editor_class    : opt.editor_class
                } );

                if( opt.form_type == 'text' ) {
                    form += opt.template( opt.text_form, {
                        id              : "jeip-edit-" + self.id,
                        editfield_class : opt.editfield_class,
                        value           : value
                    } );
                } // text form
                else if( opt.form_type == 'textarea' ) {
                    var length = value.length;
                    var rows = ( length / opt.cols ) + 2;

                    for( var i = 0; i < length; i++ ) {
                        if( value.charAt( i ) == "\n" ) {
                            rows++;
                        }
                    }

                    if( rows > opt.max_rows ) {
                        rows = opt.max_rows;
                    }
                    if( opt.rows != false ) {
                        rows = opt.rows;
                    }
                    rows = parseInt( rows );

                    form += opt.template( opt.textarea_form, {
                        id              : "jeip-edit-" + self.id,
                        cols            : opt.cols,
                        rows            : rows,
                        editfield_class : opt.editfield_class,
                        value           : value
                    } );
                } // textarea form
                else if( opt.form_type == 'select' ) {
                    form += opt.template( opt.start_select_form, {
                        id              : "jeip-edit-" + self.id,
                        editfield_class : opt.editfield_class
                    } );

                    $.each( opt.select_options, function( k, v ) {
                        var selected = '';
                        if( v == value ) {
                            selected = 'selected="selected"';
                        }

                        if( value == v ) {
                            orig_option_value = k;
                        }

                        form += opt.template( opt.select_option_form, {
                            id          : "jeip-edit-option-" + self.id + "-" + k,
                            option_value: k,
                            option_text : v,
                            selected    : selected
                        } );
                    } );

                    form += opt.template( opt.stop_select_form, { } );
                } // select form

                form += opt.template( opt.form_buttons, {
                    save_id             : "jeip-save-" + self.id,
                    cancel_id           : "jeip-cancel-" + self.id,
                    savebutton_class    : opt.savebutton_class,
                    savebutton_text     : opt.savebutton_text,
                    cancelbutton_class  : opt.cancelbutton_class,
                    cancelbutton_text   : opt.cancelbutton_text
                } );

                form += opt.template( opt.stop_form, { } );

                $self.after( form );
                $( "#jeip-editor-" + self.id ).fadeIn( "fast" );

                if( opt.focus_edit ) {
                    $( "#jeip-edit-" + self.id ).focus( );
                }

                if( opt.select_text ) {
                    $( "#jeip-edit-" + self.id ).select( );
                }

                $( "#jeip-cancel-" + self.id ).bind( "click", function() {
                    _cancelEdit( self );
                } );

                $( "#jeip-edit-" + self.id ).keydown( function( e ) {
                    // cancel
                    if( e.which == 27 ) {
                        _cancelEdit( self );
                    }

                    // save
                    if( opt.form_type != "textarea" && e.which == 13 ) {
                        _saveEdit( self, orig_option_value );
                    }
                } );

                $( "#jeip-save-" + self.id ).bind( "click", function() {
                    return _saveEdit( self, orig_option_value );
                } ); // save click
            } ); // this fadeOut
        } // function _editMode

        var _cancelEdit = function( self ) {
            var $self = $( self );

            $( "#jeip-editor-" + self.id ).fadeOut( "fast", function() {
                $( this ).remove();

                if( opt.mouseover_class ) {
                    $self.removeClass( opt.mouseover_class );
                }

                $self.fadeIn( "fast" );
            } );

            $self.bind( opt.edit_event, function() {
                _editMode( self );
            } );
        };

        var _saveEdit = function( self, orig_option_value ) {
            var $self = $( self );
            var orig_value = $self.html( );
            var new_value = $( "#jeip-edit-" + self.id ).attr( "value" );

            if( orig_value == new_value ) {
                $( "#jeip-editor-" + self.id ).fadeOut( "fast", function() {
                    $( this ).remove();

                    if( opt.mouseover_class ) {
                        $self.removeClass( opt.mouseover_class );
                    }

                    $self.fadeIn( "fast" );
                });

                $self.bind( opt.edit_event, function() {
                    _editMode( self );
                } );

                return true;
            }

            $( "#jeip-editor-" + self.id ).after( opt.template( opt.saving, {
                id          : "jeip-saving-" + self.id,
                saving_class: opt.saving_class,
                saving_text : opt.saving_text
            } ) );
            $( "#jeip-editor-" + self.id ).fadeOut( "fast", function( ) {
                $( "#jeip-saving-" + self.id).fadeIn( "fast" );
            } );

            var name = 'value';

            $.each( ['name', 'data-name', 'id'], function( k, v ) {
                v = $.trim( $self.attr( v ) );

                if( v.length ) {
                    name = v;
                    return false;
                }
            } );

            var ajax_data = {};
            ajax_data[ name ] = new_value;

            var context_data = {
                url         : location.href,
                id          : self.id,
                form_type   : opt.form_type,
                orig_value  : orig_value,
                new_value   : new_value,
                data        : opt.data
            }

            if( opt.form_type == 'select' ) {
                context_data.orig_option_value = orig_option_value;
                context_data.orig_option_text = orig_value;
                context_data.new_option_text = $( "#jeip-edit-option-" + self.id + "-" + new_value ).html( );
            }

            if ( typeof opt.prepare_data === "function" ) {
                $.extend( ajax_data, opt.prepare_data( context_data ));
            }

            var handle_response = function( data, textStatus, jqXHR ) {
                $( "#jeip-editor-" + self.id ).fadeOut( "fast", function() {
                    $( this ).remove();
                } );

                if( data.error ) {
                    opt.on_error( data.error, data, textStatus, jqXHR );
                }
                else if( data.html ) {
                    $self.html( data.html );
                }

                $( "#jeip-saving-" + self.id ).fadeOut( "fast", function() {
                    $( this ).remove();

                    if( opt.mouseover_class ) {
                        $self.addClass( opt.mouseover_class );
                    }

                    $self.fadeIn( "fast" );

                    if( !data.error && typeof opt.after_save === "function" ) {
                        opt.after_save( self );
                    }

                    if( opt.mouseover_class ) {
                        $self.removeClass( opt.mouseover_class );
                    }
                } );

                $self.bind( opt.edit_event, function() {
                    _editMode( self );
                } );
            }

            $.ajax( {
                url     : opt.save_url,
                type    : opt.request_type,
                dataType: "json",
                data    : ajax_data,
                success : handle_response,
                error   : function( jqXHR, textStatus, errorThrown ) {
                    errorThrown = errorThrown || 'Unknown error';
                    handle_response( { error : errorThrown }, textStatus, jqXHR );
                }
            } ); // ajax
        }; // _saveEdit


    }; // inplaceEdit
})( jQuery );
