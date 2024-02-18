import { Component } from "react";
import propTypes from "prop-types";

export class WebSocketHelper extends Component {
    constructor(props) {
        super(props);
        this.state = {
            ws: null,
        };
    }

    timeout = 250; // milliseconds

    componentDidMount() {
        this.connect();
        this.keep_alive = setInterval(() => {
            this.sendMessage({ keepAlive: {} });
        }, 2500);
    }

    componentWillUnmount() {
        clearInterval(this.keep_alive);
        this.setState({ ws: null });
    }

    shouldComponentUpdate(nextProps) {
        return nextProps.ws_url !== this.props.ws_url;
    }

    connect = () => {
        var ws = new WebSocket(this.props.ws_url);
        this.props.status("connecting");
        let that = this; // cache the this
        var connectInterval;

        ws.onopen = () => {
            this.setState({ ws: ws });
            this.props.status("connected");
            console.log("Connected to WebSocket at :", this.props.ws_url);
            that.timeout = 250;
            clearTimeout(connectInterval);
        };

        ws.onclose = (e) => {
            console.log(`Socket is closed. Reconnect will be attempted in ${Math.min(5000 / 1000, (that.timeout * 2) / 1000)} second.`, e.reason);
            this.props.status("closed");
            that.timeout = that.timeout * 2;
            connectInterval = setTimeout(this.checkSocketConnection, Math.min(5000, that.timeout));
        };

        ws.onerror = (err) => {
            console.error("Socket encountered error: ", err.message, "Closing socket");

            this.props.status("error");
            ws.close();
        };

        ws.onmessage = (event) => {
            try {
                // Preprocess the message to replace 'NaN' with 'null'
                const processedMessage = event.data.replace(/NaN/g, "null");

                // Parse the processed message
                const data = JSON.parse(processedMessage);

                // Rest of your logic
                if (data.publishers && data.signals) {
                    this.props.updatePublishersAndSignals(data.publishers, data.signals);
                } else {
                    this.props.messageProcess(data);
                }
            } catch (e) {
                console.log(e);
                console.log(event.data);
            }
        };
    };

    sendMessage = (msg) => {
        const { ws } = this.state;
        if (ws && ws.readyState !== WebSocket.CLOSED) ws.send(JSON.stringify(msg));
    };

    checkSocketConnection = () => {
        const { ws } = this.state;
        if (!ws || ws.readyState === WebSocket.CLOSED) {
            console.log("WebSocket is closed. Reconnect will be attempted");
            this.connect(this.props.ws_url);
        }
    };

    render() {
        //console.log("Rendering WebSocketHelper");
        return null;
    }
}

WebSocketHelper.propTypes = {
    ws_url: propTypes.string.isRequired,
    status: propTypes.func.isRequired,
    messageProcess: propTypes.func.isRequired,
};
