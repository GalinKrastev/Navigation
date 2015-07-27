(function ($) {

    ($.fn.deepestChild == undefined && ($.fn.deepestChild = function (attribute) {
        if ($(this).children().length == 0 ||
            $(this).attr(attribute))
                return $(this);
        var $target = $(this).children(),
        $next = $target;
        while ($next.length && !($next.attr(attribute))) {
            $target = $next;
            $next = $next.children();
        }

        return $target.first();
    }));

    ($.fn.checked == undefined && ($.fn.checked = function (value) {
        if ($(this).attr("disabled"))
            return $(this);

        if (value === true || value === false)
            $(this).each(function () {
                this.checked = value;
            });
        else if (value === undefined || value === 'toggle')
            $(this).each(function () {
                this.checked = !this.checked;
            });

        return this;
    }));

    ($.fn.hasScrollBar == undefined && ($.fn.hasScrollBar = function() {
        return this.get(0).scrollHeight > this.height();
    }));

}(jQuery));

(window.Navi == undefined && (window.Navi = {})); (function (navi) {

    navi.KeyCodes = {
        LEFT: 37,
        RIGHT: 39,
        UP: 38,
        DOWN: 40,
        F: 70,
        TAB: 9,
        ENTER: 13,
        ESCAPE: 27
    };

    navi.Directions = {
        PREV: "prev",
        NEXT: "next"
    };

    navi.ConstantActivation = "administation-navigator-constantly-turned-on"

    navi.isStarted = false;

    navi.helpers = {
        findMarkedIndex: function (selectors) {
            var
                sectionItems = $(selectors.main).find(selectors.item + ":visible"),
                markedIndex = undefined,
                markClass = selectors.marked.replace(/\./g, '');
            $(sectionItems).each(function (index) {
                if ($(this).hasClass(markClass)) {
                    markedIndex = index;

                    return false;
                }
            });

            return markedIndex;
        },
        searchHistoryForVisibleItems: function (/*selectors.history*/ history) {
            var
                historyCopy = $.extend(true, [], history),
                returnElement = undefined;
            $(historyCopy.reverse()).each(function (index, el) {
                if ($(el).size() > 0 && $(el).is(":visible")) {
                    returnElement = $(el).first();

                    return false;
                }
            });

            return returnElement;
        },
        unmark: function (selectors) {
            $(selectors.main).find(selectors.marked)
                .removeClass(selectors.marked.replace(/\./g, ''));
        },
        mark: function (selectors, direction) {
            var markClass = selectors.marked.replace(/\./g, ''),
            markedItem = this.findMarkedIndex(selectors),
            elementToMark = undefined;

            if (markedItem !== undefined) {
                this.unmark(selectors);
                var indexToNavigate = (direction == navi.Directions.NEXT) ?
                    markedItem + 1 : markedItem - 1;
                    elementToMark = $($(selectors.main)
                        .find(selectors.item + ":visible")[indexToNavigate])
                        .toggleClass(markClass);
                if (elementToMark.size() > 0)
                    selectors.history.push(elementToMark);

            } else if (selectors.history.length > 0) {
                var lastVisibleMarkedElement =
                    this.searchHistoryForVisibleItems(selectors.history);
                if (lastVisibleMarkedElement != undefined &&
                    lastVisibleMarkedElement.size() > 0) {
                    $(lastVisibleMarkedElement).toggleClass(markClass);
                }
            } else {
                elementToMark =
                    $(selectors.main).find(selectors.item + ":visible").first();
                if (elementToMark.size() > 0) {
                    elementToMark.toggleClass(markClass);
                    selectors.history.push(elementToMark);
                }
            }

            if (elementToMark && elementToMark.size() > 0){
                this.scrollTo(elementToMark);
                setTimeout(function (){
                    navi.helpers.scrollWindow(elementToMark, direction)
                }, 400);
            }

        },
        select: function (selectors, event) {
            /*
                the marked element could be hidden, if the user interacts
                with the mouse and keyboard at the same time
            */
            if ($(selectors.main).find(selectors.marked + ":visible").size() === 0)
                return false;
            var
                Elements = {
                    BUTTON: "button",
                    INPUT: "input",
                    TEXTAREA: "textarea",
                    SELECT: "select",
                    OPTION: "option",

                    LIST_ITEM: "li",
                    DIVISION: "div",
                    SPAN: "span",
                    LABEL: "label",
                    ANCHOR: "a"
                },
                marked = $(selectors.main).find(selectors.marked + ":visible"),
                tagName = marked.prop("tagName"),
                captureKeyPress = true;
            switch (tagName.toLowerCase()) {
                case Elements.BUTTON:
                    if (marked.attr("data-toggle") == "dropdown") {
                        setTimeout(function () { $(marked).dropdown('toggle') }, 200);
                    } else if (marked.find("[ng-click]").size() > 0) {
                        marked.deepestChild("ng-click").click();
                    } else {
                        marked.click();
                    }
                    break;
                case Elements.INPUT:
                case Elements.TEXTAREA:
                    if (marked.attr("type") == "checkbox" ||
                        marked.attr("type") == "radio") {
                        marked.checked();
                    } else {
                        if (marked[0].id && (marked[0].id == "startDate" || marked[0].id == "endDate")) {
                            var dateFormat = null;
                            PublishSubscribe.subscribe("NavigationResponseDateFormat", function (format) {
                                dateFormat = format;
                            });
                            PublishSubscribe.publish("NavigationRequestDateFormat");
                            PublishSubscribe.publish(
                                marked[0].id == "startDate" ? "NavigationStartDateChanged" : "NavigationEndDateChanged",
                                prompt(dateFormat.toLowerCase() + ":")
                            );
                        } else {
                            var markText = function (e) { $(this).select(); }
                            marked.on("focus", markText).focus().off("focus", markText);
                        }
                    }
                    break;
                case Elements.SELECT:
                case Elements.OPTION:
                case Elements.LIST_ITEM:
                case Elements.DIVISION:
                case Elements.SPAN:
                    if (marked.hasClass("ng-binding")) {
                        marked.click();
                    } else if (marked.find("[ng-click]").size() > 0) {
                        marked.deepestChild("ng-click").click();
                    } else {
                        marked.click();
                    }
                    break;
                case Elements.LABEL:
                    if (marked.attr("for") && marked.attr("for") != "") {
                        var actualElement = $("#" + marked.attr("for"));
                        if ((actualElement.size() > 0 && actualElement.prop("tagName").toLowerCase() == "input") &&
                            (actualElement.attr("type") == "checkbox" || actualElement.attr("type") == "radio")) {
                            actualElement[0].click();

                            captureKeyPress = true;
                        }
                    }
                    break;
                case Elements.ANCHOR:
                    var
                        href = marked.attr("href"),
                        isRelative = !(/^(http|https)/.test(href));

                    // test for angular link
                    if (href && href.trim() != "#" && !marked.attr("ng-click")) {
                        if (isRelative) {
                            var
                                linkParts = [],
                                currentLocation = window.location.href,
                                protocol = (currentLocation.indexOf("http://") > -1) ? "http://" :
                                    (currentLocation.indexOf("https://") > -1) ? "https://" : "",
                                host,
                                project;

                            linkParts.push(protocol);
                            currentLocation = currentLocation.slice(protocol.length);
                            host = currentLocation.split("/")[0];
                            linkParts.push(host);
                            project = currentLocation.split("/")[1];
                            linkParts.push((href.indexOf(project) > -1) ? "" : project);
                            linkParts.push(href);

                            window.location.href = linkParts.join("");
                        } else
                            window.location.href = href;
                    } else {
                        marked.click();
                    }
                    break;
                default:
                    marked.click();
                    break;
            }

            return captureKeyPress;
        },
        scrollTo: function (element) {
            var scrollableElement = null;
            var offsetTop = 100;
            if ($(element).parents(".mCustomScrollbar").size() > 0) {
                result = true;
                $(element).parents(".mCustomScrollbar").first()
                    .mCustomScrollbar("scrollTo", $(element).first(), {});

                scrollableElement = $(element).first();
            } else {
                var parentScrollableElement = null,
                    offsetTop = 100;
                $(element)
                    .parents(":not(body, html)")
                    .each(function (element, index) {
                        if( $(this).hasScrollBar() ) {
                            parentScrollableElement = $(this);

                            return false;
                        }
                    });

                if(null != parentScrollableElement){
                    scrollableElement = parentScrollableElement;
                    parentScrollableElement.animate({
                        scrollTop: $(element).position().top +
                            $(parentScrollableElement).scrollTop() - offsetTop
                        }, {
                            duration: 'fast',
                            easing: 'swing'
                        });
                }
            }

            return scrollableElement;
        },
        scrollWindow: function (element, direction) {
            var
                animateParams = { duration: 'fast', easing: 'swing'},
                scrollPixelsTop = function (element, offsetTop) {
                    offsetTop = offsetTop || 100;

                    return $(window).height() + $(window).scrollTop() - element.offset().top < offsetTop ?
                        element.offset().top - offsetTop :
                        undefined
                },
                scrollPixelsBottom = function (element, offsetBottom) {
                    offsetBottom = offsetBottom || 100;

                    return element.offset().top - $(window).scrollTop() < offsetBottom ?
                        element.offset().top - ($(window).height() - offsetBottom) :
                        undefined
                };
            $('html, body').animate({
                scrollTop: (function () {
                    return direction == navi.Directions.NEXT ?
                        scrollPixelsTop(element):
                        scrollPixelsBottom(element)
                }())
            }, animateParams);
        },
        focusOutAll: function () {
            for (section in navi.Section) {
                if (navi.Section.hasOwnProperty(section)) {
                    var s = navi.Section[section].selectors;
                    $(s.main).find(s.item).blur();
                }
            }
        },
        awaitForElement: function (selector, awaitTime, checkInterval, errorMessage) {
            var
                df = $.Deferred(),
                awaitTime = awaitTime || 10000,
                checkInterval = checkInterval || 250,
                errorMessage = errorMessage || "Couldn't find the requested content.",
                timer = null,
                timeout = window.setTimeout(function () {
                    df.reject($("<span>" + escape(errorMessage) + "</span>"));
                }, awaitTime),
                timer = window.setInterval(function () {
                    var size = $(selector).size();
                    if (size > 0) {
                        window.clearInterval(timer);
                        if (timeout) window.clearTimeout(timeout);
                        df.resolve($(selector));
                    }
                }, checkInterval);

            return df.promise();
        },
        supportHtml5Storage: function() {
            try {
                return 'localStorage' in window && window['localStorage'] !== null;
            } catch (e) {
                console.log(e.message);
                return false;
            }
        }
    };

    navi.ModalDialogs = (function () {
        var modals = [];
        var modalIndex = 0;

        return {
            add: function (modalDialog) {
                modals.push(
                    modalDialog
                        .removeAttr("modalDialog")
                        .attr("modalDialog", ++modalIndex)
                );

                return modals;
            },
            remove: function (modalDialod) {
                var index = $.inArray(modalDialod.removeAttr("modalDialog"), modals);

                return index > -1 ? modals.slice(index, 1) : modalDialod;
            },
            update: function () {
                var modalDialogsSelector = "[aria-hidden='false'].modal:not([modaldialog])",
                    naviItemsSelector = [
                        ".admin-navi-left-item:visible",
                        ".admin-navi-top-item:visible",
                        ".admin-navi-right-item:visible"
                    ].join(", "),
                    self = this;
                /*
                    modals selector $("[aria-hidden='false'].modal"),
                    if area-hidden is true, this means that the modal
                    is not open, so it has to be removed from the list
                */
                for (var i = modals.length - 1; i >= 0; i--)
                    if (modals[i].attr("aria-hidden") == "true") {
                        this.remove(modals[i]);
                    }


                /*
                    the other case ... if new popups have just appeared
                */
                navi.helpers.awaitForElement(modalDialogsSelector, 1000, 100)
                    .done(function (modal) {
                        // navi support test
                        if (modal.find(naviItemsSelector).size() > 0)
                            self.add(modal);
                    });
            },
            topLayerSelector: function () {
                this.update();
                modals.sort(function (left, right) {
                    var
                        leftAttr = parseInt(left.attr("modalDialog")),
                        rightAttr = parseInt(right.attr("modalDialog"));

                    return (leftAttr < rightAttr) ? -1 : 1;
                });

                return modals.length >= 1 ?
                    (function () {
                        var uniqueNumber = modals[modals.length - 1].attr("modalDialog")

                        return uniqueNumber ? "[modalDialog='" + uniqueNumber + "']" : null
                    })()
                    : null;
            }
        }
    }());
    navi.Section = (function () {
        var obj = function () {
            this.TOP = {
                name: "TOP", active: false, selectors: {
                    main: ".admin-navi-top",
                    item: ".admin-navi-top-item",
                    marked: ".admin-navi-top-marked",
                    history: []
                }
            };
            this.LEFT = {
                name: "LEFT", active: false, selectors: {
                    main: ".admin-navi-left",
                    item: ".admin-navi-left-item",
                    marked: ".admin-navi-left-marked",
                    history: []
                }
            };
            this.RIGHT = {
                name: "RIGHT", active: false, selectors: {
                    main: ".admin-navi-right",
                    item: ".admin-navi-right-item",
                    marked: ".admin-navi-right-marked",
                    history: []
                }
            };

            return this;
        };
        obj.prototype = {
            constructor: obj,
            reset: function () {
                for (prop in this)
                    if (this.hasOwnProperty(prop)) {
                        this[prop].active = false;
                        this[prop].selectors.history = []
                    }

                return this;
            },
            unmarkSections: function (
                /* optional, default is all, options: all||active||inactive||top||left||right */sections) {
                sections = sections || "all";
                sections = sections.toLowerCase();
                var activeSection = this.active();
                for (prop in this) {
                    if (sections == "inactive" &&
                        this[prop] == activeSection)
                        continue;
                    else if (sections == "active" &&
                        this[prop] != activeSection)
                        continue;
                    else if (/left|right|top/.test(sections)) {
                        navi.helpers.unmark(this[sections.toUpperCase()].selectors);
                        continue;
                    }
                    // in case all has to be unmarked
                    if (this.hasOwnProperty(prop))
                        navi.helpers.unmark(this[prop].selectors);
                }
            },
            active: function (sectionName) {
                if (sectionName && typeof sectionName == "string" &&
                    this.hasOwnProperty(sectionName)) {
                        this.reset()
                        this[sectionName].active = true;
                        this.unmarkSections("inactive");
                        navi.helpers.focusOutAll();
                        navi.helpers.mark(this[sectionName].selectors);

                    return this[sectionName].active;
                }
                else {
                    for (prop in this)
                        if (this.hasOwnProperty(prop) && this[prop].active === true)
                            return this[prop].name
                }

                return null;
            },
            processKeyCombination: function (keyCombo) {
                /*
                 * keyCombo = {
                 *     keyCode: xx,
                 *     isSelectedShift: boolean,
                 *     isSelectedAlt: boolean,
                 *     event: object
                 * }
                 */
                if ($(this.TOP.selectors.main).size() == 0 &&
                        $(this.LEFT.selectors.main).size() == 0 &&
                        $(this.RIGHT.selectors.main).size() == 0
                ) return undefined;

                var captureKeyCombo = true;
                var modalDialogTopLayerSelector = navi.ModalDialogs.topLayerSelector();
                if (modalDialogTopLayerSelector) {
                    var modalSelectors = {
                        main: modalDialogTopLayerSelector,
                        item: [this.TOP.selectors.item, this.LEFT.selectors.item, this.RIGHT.selectors.item].join(", "),
                        marked: this.LEFT.selectors.marked,
                        history: []
                    };
                    (function (section) {
                        if (keyCombo.isSelectedAlt ||
                            keyCombo.keyCode == navi.KeyCodes.LEFT ||
                            keyCombo.keyCode == navi.KeyCodes.DOWN ||
                            keyCombo.keyCode == navi.KeyCodes.RIGHT) {
                            captureKeyCombo = false;
                        } else if (keyCombo.keyCode == navi.KeyCodes.TAB &&
                            !keyCombo.isSelectedAlt) {
                            navi.helpers.mark(
                                modalSelectors,
                                (keyCombo.isSelectedShift) ?
                                    navi.Directions.PREV : navi.Directions.NEXT
                            );
                        } else if (keyCombo.keyCode == navi.KeyCodes.ENTER &&
                            !keyCombo.isSelectedShift &&
                            !keyCombo.isSelectedAlt) {
                            navi.helpers.select(modalSelectors, keyCombo.event);
                            navi.ModalDialogs.update();
                        } else if (keyCombo.keyCode == navi.KeyCodes.ESCAPE) {
                            var modalCloseButton = $(modalSelectors.main).removeAttr("modalDialog").find("[data-dismiss='modal']");
                            if (modalCloseButton.size() > 0) {
                                modalCloseButton.click();
                                navi.ModalDialogs.update();
                            }
                        } else {
                            captureKeyCombo = false;
                        }
                    }(this));

                    return captureKeyCombo ? false : undefined;
                }

                switch (this.active()) {
                    case this.TOP.name:
                        (function (section) {
                            if (keyCombo.isSelectedAlt) {
                                if (keyCombo.keyCode == navi.KeyCodes.LEFT ||
                                    keyCombo.keyCode == navi.KeyCodes.DOWN) {
                                    section.active(section.LEFT.name);
                                } else if (keyCombo.keyCode == navi.KeyCodes.RIGHT) {
                                    section.active(section.RIGHT.name);
                                } else {
                                    captureKeyCombo = false;
                                }
                            } else if (keyCombo.keyCode == navi.KeyCodes.TAB &&
                                !keyCombo.isSelectedAlt) {
                                navi.helpers.mark(
                                    section.TOP.selectors,
                                    (keyCombo.isSelectedShift) ?
                                        navi.Directions.PREV : navi.Directions.NEXT
                                );
                            } else if (keyCombo.keyCode == navi.KeyCodes.ENTER &&
                                !keyCombo.isSelectedShift &&
                                !keyCombo.isSelectedAlt) {
                                captureKeyCombo =
                                    navi.helpers.select(section.TOP.selectors, keyCombo.event);
                                navi.ModalDialogs.update();
                            } else {
                                captureKeyCombo = false;
                            }
                        }(this));
                        break;

                    case this.LEFT.name:
                        (function (section) {
                            if (keyCombo.isSelectedAlt) {
                                if (keyCombo.keyCode == navi.KeyCodes.LEFT) {
                                    section.active(section.LEFT.name);
                                } else if (keyCombo.keyCode == navi.KeyCodes.RIGHT) {
                                    section.active(section.RIGHT.name);
                                } else if (keyCombo.keyCode == navi.KeyCodes.DOWN) {
                                    // do nothing
                                } else if (keyCombo.keyCode == navi.KeyCodes.UP) {
                                    section.active(section.TOP.name);
                                } else {
                                    captureKeyCombo = false;
                                }
                            } else if (keyCombo.keyCode == navi.KeyCodes.TAB &&
                                !keyCombo.isSelectedAlt) {
                                navi.helpers.mark(
                                    section.LEFT.selectors,
                                    (keyCombo.isSelectedShift) ?
                                        navi.Directions.PREV : navi.Directions.NEXT
                                );
                            } else if (keyCombo.keyCode == navi.KeyCodes.ENTER &&
                                !keyCombo.isSelectedShift &&
                                !keyCombo.isSelectedAlt) {
                                captureKeyCombo =
                                    navi.helpers.select(section.LEFT.selectors, keyCombo.event);
                                navi.ModalDialogs.update();
                            } else {
                                captureKeyCombo = false;
                            }
                        }(this));
                        break;

                    case this.RIGHT.name:
                        (function (section) {
                            if (keyCombo.isSelectedAlt) {
                                if (keyCombo.keyCode == navi.KeyCodes.LEFT) {
                                    section.active(section.LEFT.name);
                                } else if (keyCombo.keyCode == navi.KeyCodes.UP) {
                                    section.active(section.TOP.name);
                                } else if (keyCombo.keyCode == navi.KeyCodes.DOWN) {
                                    // do nothing
                                } else {
                                    captureKeyCombo = false;
                                }

                            } else if (keyCombo.keyCode == navi.KeyCodes.TAB &&
                                !keyCombo.isSelectedAlt) {
                                navi.helpers.mark(
                                    section.RIGHT.selectors,
                                    (keyCombo.isSelectedShift) ?
                                        navi.Directions.PREV : navi.Directions.NEXT
                                );
                            } else if (keyCombo.keyCode == navi.KeyCodes.ENTER &&
                                !keyCombo.isSelectedShift &&
                                !keyCombo.isSelectedAlt) {
                                captureKeyCombo =
                                    navi.helpers.select(section.RIGHT.selectors)
                                navi.ModalDialogs.update();
                            } else {
                                captureKeyCombo = false;
                            }
                        }(this));
                        break;

                    default:
                        this.active(this.LEFT.name)
                        captureKeyCombo = false;
                }

                return captureKeyCombo ? false : undefined;
            }
        }

        return new obj();
    }());


    navi.naviKeyDownDispatcher = function naviKeyDownDispatcher(e) {
        e = e || window.event;

        return navi.Section.processKeyCombination({
            keyCode: e.keyCode,
            isSelectedAlt: e.altKey,
            isSelectedShift: e.shiftKey,
            event: e
        });
    };

    return navi;
}(Navi));

(function () {
    Navi.stop = function () {
        if (Navi.isStarted) {
            Navi.isStarted = false;
            Navi.Section.unmarkSections();
            $(document).off("keydown", "body", Navi.naviKeyDownDispatcher);
        }

        if(Navi.helpers.supportHtml5Storage())
            localStorage.setItem(Navi.ConstantActivation, false);

        return Navi;
    };
    Navi.start = function () {
        if (!this.isStarted) {
            $(document).on("keydown", "body", null, Navi.naviKeyDownDispatcher);
            Navi.isStarted = true;

            // set active section, highlighting comes automatic
            Navi.Section.active(Navi.Section.LEFT.name);

            // constant activation of the navi, untill manually turned off
            if(Navi.helpers.supportHtml5Storage())
                localStorage.setItem(Navi.ConstantActivation, true);
        }

        return Navi;
    };
    Navi.toggle = function () {
        return Navi.isStarted ? Navi.stop() : Navi.start();
    }

    $(document).on("keydown", function (ev) {
        var pageUpKeyCode = 33;
        if (ev.keyCode == pageUpKeyCode && ev.altKey && ev.shiftKey) {
            Navi.start();
            PublishSubscribe.publish("navigationIsStarted");
        }
    });
    $(document).on("keydown", function (ev) {
        var pageDownKeyCode = 34;
        if (ev.keyCode == pageDownKeyCode && ev.altKey && ev.shiftKey) {
            Navi.stop();
            PublishSubscribe.publish("navigationIsStopped");
        }
    });
    $(document).on("keydown", function (ev) {
        var keyK = 75;
        if (ev.keyCode == keyK && ev.altKey) {
            PublishSubscribe.publish("navigationShowInfo");
        }
    });
   $(document).ready(function () {
       if(Navi.helpers.supportHtml5Storage() &&
          localStorage.getItem(Navi.ConstantActivation) == "true")
            $(window).load(function () { setTimeout(Navi.start, 1000) });
   });
}());
