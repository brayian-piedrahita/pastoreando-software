package co.pastoreando.app.dominio;

/** Ganado de leche: el ordeno y la cadena de frio recargan el manejo un 10 %. */
public final class EstrategiaLeche implements EstrategiaCosto {

    @Override
    public String valorApi() {
        return "Leche";
    }

    @Override
    public double factorManejo() {
        return 1.10;
    }
}
