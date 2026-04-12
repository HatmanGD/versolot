import React from 'react';
import {defineMessages, FormattedMessage, intlShape, injectIntl} from 'react-intl';
import classNames from 'classnames';
import styles from './loader.css';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import sprunki from './sprunki.svg';

import * as progressMonitor from './tw-progress-monitor';
import isScratchDesktop from '../../lib/isScratchDesktop';

// tw:
// we make some rather large changes here:
//  - remove random message, replaced with message dependent on what is actually being loaded
//  - add a progress bar
//  - bring in intl so that we can translate everything
// The way of doing this is extremely unusual and weird compared to how things are typically done for performance.
// This is because react updates are too performance crippling to handle the progress bar rapidly updating.

const tips = [
"On with the show!",
"I am 19, i love cats and cars X3.",
"YOU MESSED THEM ALL UP WITH CATS, POPEYES, DOUG, ANGELICA, AND LITTLE KIDDIE SHOWS!",
"Your TROLLFACE!!!!",
"Hello, immortal pineapple-and-banana-pepper-pizza!",
"Holy spinach teeth?",
"Holy cheese and crackers!",
"I’ve had all sorts of succotash",
"Clone your fork",
"This is bananas: P-Q-L-E-F-E-T!",
"Some spinach teeth and flying balogna, and the secret spaghetti cannons, and crackers, and spinach, and succotash...",
"I am kinda curious to see if you can really turn my teeth to spinach",
"I WON'T OBEY A BUNCH OF CORN AND BEANS!",
"That's Nick's garbage!",
"Nick's garbage is my garbage!",
"Consuela throws poor Buster in the garbage with the flies.",
"This garbage attracts flies and huge roaches like crazy",
"Wowsers indeed",
"Crackers don't scare me.",
"I hate hamburgers.",
"I have some moles lol",
"My teeth are not spinach lol",
"lol heart gold and soul silver.",
"max tomato = diarrhea in the halberd xD",
"Excuse my Asperger's, por favor.",
"Evil dill in the background",
"*While hiding: They buttered popcorn?",
"Wait—is it really a felony to put boogers in someone's food?",
"No Boogers In My Burgers!",
"I misread one of your quotes as \"No! Bob's Boogers is garbage!\"",
"Don't eat pigs, don't eat BATS, Don't eat beetles, flies or gnats.",
"Aspergers, same as me",
"You can draw all the bubblegum and chocolate Pop Rocks you want.",
"paper in your ear?",
"Listen the moles, freckles, and warts thing is getting old.",
"Bees, wasps: Yes. Moles, freckles, and warts: No.",
"*And they cover her face with lots of warts, freckles and moles*",
"Keep your wankin' moles and whatnot!",
"*Creates black moles freckles and warts with red eyes as they kill your creations!*",
"*Create a Spinach Teeth Cannon then fire it*'",
"*Eats Spinach and has spinach teeth and the zits faint*",
"*Creates blue zits, blackheads and abscesses*",
"*poofs Pac-Man away*",
"STOP SENDING YOUR WHITE KNIGHTS AFTER AKIRA!",
"*they get on my face* AHHH!",
"EWWW!!! BOOGERS!!!",
"I DON'T LIKE THE VOMIT THING, YOU DO!!!",
"WHAT ARE SPINACH TEETH!?",
"I WOULDN'T EAT FACE MOLES!",
"WHAT IS SO GREAT ABOUT WALMART ANYWAY!?",
"SUCCOTASH DOESN'T SCARE ME!",
"IS THERE ANYTHING TO EAT BESIDES SUCCOTASH CRACKERS WAFFLES AND HAMHOCKS!?",
"I HATE SUCCOTASH AND SPINACH! HERE!",
"EVERYONE THERE'S A SPINACH HURRICANE COMING TOWARDS US!",
"And then threatening to knock their teeth out.",
"I want you to make the Alex sculpture from a succotash and crackers.",
"Swatting flies won't make the wasps go away.",
"Death Pies or badly drawn Jynx lips?",
"what kind of pies",
"Ice cream pickles lol",
"I hate pickles though",
"I planted a trollface in this picture just for the fun of it.",
"Lol, trollfaces and bellies = pure fun",
"delicious waffles",
"ARENT THE BLEMISHES ATTRACTED TO PIE!?",
"ARE THEY ATTRACTED TO PIE?",
"THATS ALL FOLKS!",
"Somebody Call A Doctor!",
"\"THERE'S A MACARONI ON MY HEAD!\"",
"AAAAAAAHHHH! FIRE!",
"AAAAAAH! THEY'RE REAL!!!",
"NICE FUCKIN' MODEL! Honk Honk",
"I BEAT CANCER!!",
"SAY \"PINGAS-ROBOTNIK-SPAGHETTI\""
]

const mainMessages = {
    'gui.loader.headline': (
        <FormattedMessage
            defaultMessage="Loading the goddamn Project"
            description="Main loading message"
            id="gui.loader.headline"
        />
    ),
    'gui.loader.creating': (
        <FormattedMessage
            defaultMessage="Creating the goddamn Project"
            description="Main creating message"
            id="gui.loader.creating"
        />
    ),
    'pm.loader.playground': (
        <FormattedMessage
            defaultMessage="Loading the goddamn Playground"
            description="Playground load message"
            id="pm.loader.playground"
        />
    )
};

const messages = defineMessages({
    generic: {
        defaultMessage: 'Load stuff …',
        description: 'Initial generic loading message',
        id: 'tw.loader.generic'
    },
    projectData: {
        defaultMessage: 'Download data …',
        description: 'Appears when loading project data',
        id: 'tw.loader.data'
    },
    assetsKnown: {
        defaultMessage: 'Downloading fucking assets ({complete}/{total}) …',
        description: 'Appears when loading project assets and amount of assets is known',
        id: 'tw.loader.assets.known'
    },
    assetsUnknown: {
        defaultMessage: 'Still downloading fucking assets …',
        description: 'Appears when loading project assets but amount of assets is unknown',
        id: 'tw.loader.assets.unknown'
    }
});

class LoaderComponent extends React.Component {
    constructor (props) {
        super(props);
        this._state = 0;
        this.progress = 0;
        this.complete = 0;
        this.total = 0;
        this.unhelpfulTip = tips[Math.round(Math.random() * tips.length)];
        bindAll(this, [
            'barInnerRef',
            'handleProgressChange',
            'messageRef'
        ]);
    }
    componentDidMount () {
        if (!isScratchDesktop()) {
            progressMonitor.setProgressHandler(this.handleProgressChange);
        }
        this.updateMessage();
    }
    componentDidUpdate () {
        this.update();
    }
    componentWillUnmount () {
        // force completion
        this.progress = 1;
        this.update();
        progressMonitor.setProgressHandler(() => {});
    }
    handleProgressChange (state, progress, complete, total) {
        if (state !== this._state) {
            this._state = state;
            this.updateMessage();
        }
        this.progress = progress;
        this.complete = complete;
        this.total = total;
        this.update();
    }
    update () {
        if (this.barInner) {
            this.barInner.style.width = `${this.progress * 100}%`;
        }
        if (this._state === 2) {
            this.updateMessage();
        }
    }
    updateMessage () {
        if (this._state === 0) {
            this.message.textContent = this.props.intl.formatMessage(messages.generic);
        } else if (this._state === 1) {
            this.message.textContent = this.props.intl.formatMessage(messages.projectData);
        } else if (this.total > 0) {
            this.message.textContent = this.props.intl.formatMessage(messages.assetsKnown, {
                complete: this.complete,
                total: this.total
            });
        } else {
            this.message.textContent = this.props.intl.formatMessage(messages.assetsUnknown);
        }
    }
    barInnerRef (element) {
        this.barInner = element;
    }
    messageRef (element) {
        this.message = element;
    }
    render () {
        return (
            <div
                className={classNames(styles.background, {
                    [styles.fullscreen]: this.props.isFullScreen
                })}
            >
                <div className={styles.container}>
                    <div className={styles.blockAnimation}>
                        <img src={sprunki} alt="A Sprunki!" width="70%"/>
                    </div>
                    <div className={styles.title}>
                        {mainMessages[this.props.messageId]}
                    </div>
                    <div className={styles.messageContainerOuter}>
                        <div
                            className={styles.messageContainerInner}
                            ref={this.messageRef}
                        />
                    </div>
                    {!isScratchDesktop() && (
                        <div className={styles.twProgressOuter}>
                            <div
                                className={styles.twProgressInner}
                                ref={this.barInnerRef}
                            />
                        </div>
                    )}
                    <br /><br />
                    <h2><p dangerouslySetInnerHTML={{__html: this.unhelpfulTip}} /></h2>
                </div>
            </div>
        );
    }    
}

LoaderComponent.propTypes = {
    isFullScreen: PropTypes.bool,
    intl: intlShape.isRequired,
    messageId: PropTypes.string
};
LoaderComponent.defaultProps = {
    isFullScreen: false,
    messageId: 'gui.loader.headline'
};

export default injectIntl(LoaderComponent);
