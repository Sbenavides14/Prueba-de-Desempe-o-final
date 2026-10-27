# Parto de la imagen oficial de Airflow, así no reinvento su instalación base.
FROM apache/airflow:2.10.2-python3.11

# Me cambio a root solo para instalar Java, que PySpark necesita para correr su motor interno.
# Sin esto, cualquier tarea que use Spark falla al arrancar, aunque pyspark esté instalado.
USER root
RUN apt-get update && \
    apt-get install -y --no-install-recommends default-jdk-headless && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/default-java

# Vuelvo al usuario airflow antes de instalar paquetes Python, por seguridad:
# nunca quiero que mis tareas corran como root.
USER airflow
COPY requirements.txt /requirements.txt
RUN pip install --no-cache-dir -r /requirements.txt
